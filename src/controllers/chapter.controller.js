const axios = require('axios');

function getListFromResponse(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.data?.content)) {
        return payload.data.content;
    }

    if (Array.isArray(payload?.content)) {
        return payload.content;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
}

function getItemFromResponse(payload) {
    if (payload?.data && !Array.isArray(payload.data)) {
        return payload.data;
    }

    return payload || {};
}

function getApiUrl() {
    return process.env.API_URL || 'http://localhost:8080';
}

function getCookieValue(req, name) {
    const cookies = req.headers.cookie || '';
    const cookie = cookies
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${name}=`));

    if (!cookie) {
        return '';
    }

    return decodeURIComponent(cookie.slice(name.length + 1));
}

function getAuthConfig(req, config = {}) {
    const token = getCookieValue(req, 'token');

    if (!token) {
        return config;
    }

    return {
        ...config,
        headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`
        }
    };
}

async function getBooks(req) {
    const response = await axios.get(
        `${getApiUrl()}/books`,
        getAuthConfig(req, {
            params: {
                page: 0,
                size: 1000
            }
        })
    );

    return getListFromResponse(response.data);
}

function getChapterPayload(body) {
    return {
        bookId: body.bookId ? Number(body.bookId) : undefined,
        title: body.title,
        audioUrl: body.audioUrl,
        duration: body.duration ? Number(body.duration) : 0,
        chapterNumber: body.chapterNumber ? Number(body.chapterNumber) : 0
    };
}

const adminRoute = process.env.ADMIN_ROUTE === '/' ? '' : (process.env.ADMIN_ROUTE || '/admin').replace(/\/$/, '');

class ChapterController {

    // GET /chapters
    async index(req, res) {
        const {
            page = 0,
            size = 10,
            search = ''
        } = req.query;

        try {
            const [chaptersResponse, books] = await Promise.all([
                axios.get(
                    `${getApiUrl()}/chapters/admin`,
                    getAuthConfig(req, {
                        params: {
                            page,
                            size,
                            search
                        }
                    })
                ),
                getBooks(req).catch(() => [])
            ]);

            const chaptersResult = chaptersResponse.data;
            const chapters = getListFromResponse(chaptersResult);
            const bookMap = books.reduce((result, book) => {
                const id = book.id ?? book._id ?? book.bookId;
                if (id !== undefined && id !== null) {
                    result[id] = book.title || `#${id}`;
                }

                return result;
            }, {});

            const pagination = {
                page: Number(page),
                size: Number(size),
                totalPages: chaptersResult.totalPages || 1,
                totalElements: chaptersResult.totalElements || chapters.length,
                hasNext: chaptersResult.hasNext || false,
                hasPrevious: chaptersResult.hasPrevious || false
            };

            return res.render('chapters/index', {
                title: 'Quan ly chuong sach',
                chapters,
                bookMap,
                pagination,
                filters: {
                    page,
                    size,
                    search
                }
            });
        } catch (error) {
            console.error(
                'Get chapters error:',
                error.response?.data ||
                error.message
            );

            return res.render('chapters/index', {
                title: 'Quan ly chuong sach',
                chapters: [],
                bookMap: {},
                pagination: {
                    page: 0,
                    size: Number(size),
                    totalPages: 1,
                    totalElements: 0,
                    hasNext: false,
                    hasPrevious: false
                },
                filters: {
                    page,
                    size,
                    search
                },
                error: 'Khong tai duoc danh sach chuong sach'
            });
        }
    }

    // GET /chapters/create
    async create(req, res) {
        return res.render('chapters/create', {
            title: 'Them chuong sach',
            chapter: {},
            books: await getBooks(req).catch(() => [])
        });
    }

    // POST /chapters
    async store(req, res) {
        try {
            await axios.post(
                `${getApiUrl()}/chapters`,
                getChapterPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect(adminRoute + '/chapters');
        } catch (error) {
            console.error(
                'Create chapter error:',
                error.response?.data ||
                error.message
            );

            return res.render('chapters/create', {
                title: 'Them chuong sach',
                chapter: req.body,
                books: await getBooks(req).catch(() => []),
                error: 'Khong tao duoc chuong sach'
            });
        }
    }

    // GET /chapters/:id
    async show(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/chapters/admin/${id}`,
                getAuthConfig(req)
            );

            return res.json(getItemFromResponse(response.data));
        } catch (error) {
            console.error(
                'Get chapter detail error:',
                error.response?.data ||
                error.message
            );

            return res.status(error.response?.status || 500).json({
                message: 'Khong tai duoc chuong sach'
            });
        }
    }

    // GET /chapters/:id/edit
    async edit(req, res) {
        const { id } = req.params;

        try {
            const [chapterResponse, books] = await Promise.all([
                axios.get(
                    `${getApiUrl()}/chapters/admin/${id}`,
                    getAuthConfig(req)
                ),
                getBooks(req)
            ]);

            const chapter = getItemFromResponse(chapterResponse.data);

            return res.render('chapters/edit', {
                title: 'Chinh sua chuong sach',
                chapter,
                books
            });
        } catch (error) {
            console.error(
                'Get edit chapter form error:',
                error.response?.data ||
                error.message
            );

            return res.redirect(adminRoute + '/chapters');
        }
    }

    // POST /chapters/:id
    async update(req, res) {
        const { id } = req.params;

        try {
            await axios.put(
                `${getApiUrl()}/chapters/${id}`,
                getChapterPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect(adminRoute + '/chapters');
        } catch (error) {
            console.error(
                'Update chapter error:',
                error.response?.data ||
                error.message
            );

            return res.render('chapters/edit', {
                title: 'Chinh sua chuong sach',
                chapter: {
                    ...req.body,
                    id
                },
                books: await getBooks(req).catch(() => []),
                error: 'Khong cap nhat duoc chuong sach'
            });
        }
    }

    // POST /chapters/:id/delete
    async destroy(req, res) {
        const { id } = req.params;

        try {
            await axios.delete(
                `${getApiUrl()}/chapters/${id}`,
                getAuthConfig(req)
            );

            return res.redirect(adminRoute + '/chapters');
        } catch (error) {
            console.error(
                'Delete chapter error:',
                error.response?.data ||
                error.message
            );

            return res.redirect(adminRoute + '/chapters');
        }
    }
}

const { wrapController } = require('../utils/logger');
module.exports = wrapController(new ChapterController(), 'ChapterController');
