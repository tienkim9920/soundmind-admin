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

function getAuthorPayload(body) {
    return {
        name: body.name,
        bio: body.bio,
        avatar: body.avatar
    };
}

const adminRoute = process.env.ADMIN_ROUTE === '/' ? '' : (process.env.ADMIN_ROUTE || '/admin').replace(/\/$/, '');

class AuthorController {

    // GET /authors
    async index(req, res) {
        const {
            page = 0,
            size = 10,
            search = ''
        } = req.query;

        try {
            const response = await axios.get(
                `${getApiUrl()}/authors`,
                getAuthConfig(req, {
                    params: {
                        page,
                        size,
                        search
                    }
                })
            );

            const authorsResult = response.data;
            const authors = getListFromResponse(authorsResult);
            const currentPage = Number(page);
            const pageSize = Number(size);

            const pagination = {
                page: currentPage,
                size: pageSize,
                totalPages: authorsResult.totalPages || currentPage + (authors.length === pageSize ? 2 : 1),
                totalElements: authorsResult.totalElements || authors.length,
                hasNext: authorsResult.hasNext ?? authors.length === pageSize,
                hasPrevious: authorsResult.hasPrevious ?? currentPage > 0
            };

            return res.render('authors/index', {
                title: 'Quan ly tac gia',
                authors,
                pagination,
                filters: {
                    page,
                    size,
                    search
                }
            });
        } catch (error) {
            console.error(
                'Get authors error:',
                error.response?.data ||
                error.message
            );

            return res.render('authors/index', {
                title: 'Quan ly tac gia',
                authors: [],
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
                error: 'Khong tai duoc danh sach tac gia'
            });
        }
    }

    // GET /authors/create
    create(req, res) {
        return res.render('authors/create', {
            title: 'Them tac gia',
            author: {}
        });
    }

    // POST /authors
    async store(req, res) {
        try {
            await axios.post(
                `${getApiUrl()}/authors`,
                getAuthorPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect(adminRoute + '/authors');
        } catch (error) {
            console.error(
                'Create author error:',
                error.response?.data ||
                error.message
            );

            return res.render('authors/create', {
                title: 'Them tac gia',
                author: req.body,
                error: 'Khong tao duoc tac gia'
            });
        }
    }

    // GET /authors/:id
    async show(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/authors/${id}`,
                getAuthConfig(req)
            );

            return res.json(getItemFromResponse(response.data));
        } catch (error) {
            console.error(
                'Get author detail error:',
                error.response?.data ||
                error.message
            );

            return res.status(error.response?.status || 500).json({
                message: 'Khong tai duoc tac gia'
            });
        }
    }

    // GET /authors/:id/edit
    async edit(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/authors/${id}`,
                getAuthConfig(req)
            );

            const author = getItemFromResponse(response.data);

            return res.render('authors/edit', {
                title: 'Chinh sua tac gia',
                author
            });
        } catch (error) {
            console.error(
                'Get edit author form error:',
                error.response?.data ||
                error.message
            );

            return res.redirect(adminRoute + '/authors');
        }
    }

    // POST /authors/:id
    async update(req, res) {
        const { id } = req.params;

        try {
            await axios.put(
                `${getApiUrl()}/authors/${id}`,
                getAuthorPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect(adminRoute + '/authors');
        } catch (error) {
            console.error(
                'Update author error:',
                error.response?.data ||
                error.message
            );

            return res.render('authors/edit', {
                title: 'Chinh sua tac gia',
                author: {
                    ...req.body,
                    id
                },
                error: 'Khong cap nhat duoc tac gia'
            });
        }
    }

    // POST /authors/:id/delete
    async destroy(req, res) {
        const { id } = req.params;

        try {
            await axios.delete(
                `${getApiUrl()}/authors/${id}`,
                getAuthConfig(req)
            );

            return res.redirect(adminRoute + '/authors');
        } catch (error) {
            console.error(
                'Delete author error:',
                error.response?.data ||
                error.message
            );

            return res.redirect(adminRoute + '/authors');
        }
    }
}

const { wrapController } = require('../utils/logger');
module.exports = wrapController(new AuthorController(), 'AuthorController');
