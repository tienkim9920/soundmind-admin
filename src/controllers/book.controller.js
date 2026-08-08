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

function getCategoryId(category) {
    return category.id ?? category._id ?? category.categoryId;
}

function getCategoryName(category) {
    return category.name ?? category.title ?? category.categoryName ?? category.slug ?? `#${getCategoryId(category)}`;
}

function getAuthorId(author) {
    return author.id ?? author._id ?? author.authorId;
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
    const token =
        req.session?.token ||
        getCookieValue(req, 'token');

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

async function getCategories(req) {
    const response = await axios.get(
        `${getApiUrl()}/categories`,
        getAuthConfig(req)
    );

    return getListFromResponse(response.data);
}

async function getAuthors(req) {
    const response = await axios.get(
        `${getApiUrl()}/authors`,
        getAuthConfig(req)
    );

    return getListFromResponse(response.data);
}

function getBookPayload(body) {
    const premiumValue =
        Array.isArray(body.isPremium)
            ? body.isPremium.at(-1)
            : body.isPremium;

    return {
        title: body.title,
        authorId: body.authorId,
        categoryId: body.categoryId,
        coverImage: body.coverImage,
        totalDuration: body.totalDuration,
        description: body.description,
        isPremium:
            premiumValue === 'true' ||
            premiumValue === 'on'
    };
}

class BookController {

    // GET /books
    async index(req, res) {

        try {

            const {
                page = 0,
                size = 10,
                search = '',
                categoryId = ''
            } = req.query;

            const API_URL = getApiUrl();

            const [booksResponse, categoriesResponse] =
                await Promise.all([

                    axios.get(
                        `${API_URL}/books`,
                        getAuthConfig(req, {
                            params: {
                                page,
                                size,
                                search,
                                categoryId
                            }
                        })
                    ),

                    axios.get(
                        `${API_URL}/categories`,
                        getAuthConfig(req)
                    )
                ]);

            const booksResult = booksResponse.data;

            const books =
                getListFromResponse(booksResult);

            const categories =
                getListFromResponse(
                    categoriesResponse.data
                );

            const categoryMap =
                categories.reduce(
                    (result, category) => {

                        const id =
                            getCategoryId(category);

                        if (
                            id !== undefined &&
                            id !== null
                        ) {
                            result[id] =
                                getCategoryName(category);
                        }

                        return result;
                    },
                    {}
                );

            const pagination = {
                page: Number(page),
                size: Number(size),
                totalPages:
                    booksResult.totalPages || 1,
                totalElements:
                    booksResult.totalElements || 0,
                hasNext:
                    booksResult.hasNext || false,
                hasPrevious:
                    booksResult.hasPrevious || false
            };

            return res.render(
                'books/index',
                {
                    title: 'Quản lý sách',
                    books,
                    categories,
                    categoryMap,
                    pagination,
                    filters: {
                        page,
                        size,
                        search,
                        categoryId
                    }
                }
            );

        } catch (error) {

            console.error(
                'Get books error:',
                error.response?.data ||
                error.message
            );

            return res.render(
                'books/index',
                {
                    title: 'Quản lý sách',
                    books: [],
                    categories: [],
                    categoryMap: {},
                    pagination: {
                        page: 0,
                        size: 10,
                        totalPages: 1,
                        totalElements: 0,
                        hasNext: false,
                        hasPrevious: false
                    },
                    filters: {
                        page:
                            req.query.page || 0,
                        size:
                            req.query.size || 10,
                        search:
                            req.query.search || '',
                        categoryId:
                            req.query.categoryId || ''
                    },
                    error:
                        'Không tải được danh sách sách'
                }
            );
        }
    }

    // GET /books/create
    async create(req, res) {
        try {
            const [categories, authors] =
                await Promise.all([
                    getCategories(req),
                    getAuthors(req)
                ]);

            return res.render('books/create', {
                title: 'Thêm sách',
                book: {},
                categories,
                authors
            });
        } catch (error) {
            console.error(
                'Get create book form error:',
                error.response?.data ||
                error.message
            );

            return res.render('books/create', {
                title: 'Thêm sách',
                book: {},
                categories: [],
                authors: [],
                error:
                    'Không tải được dữ liệu form'
            });
        }
    }

    // POST /books
    async store(req, res) {

        try {
            await axios.post(
                `${getApiUrl()}/books`,
                getBookPayload(req.body),
                getAuthConfig(req)
            );
            return res.redirect('/books');
        } catch (error) {
            console.error(
                'Create book error:',
                error.response?.data ||
                error.message
            );

            return res.render('books/create', {
                title: 'Thêm sách',
                book: req.body,
                categories: await getCategories(req).catch(() => []),
                authors: await getAuthors(req).catch(() => []),
                error:
                    'Không tạo được sách'
            });
        }
    }

    // GET /books/:id
    show(req, res) {

        const { id } = req.params;

        res.send(`Book detail ${id}`);
    }

    // GET /books/:id/edit
    async edit(req, res) {

        const { id } = req.params;

        try {
            const [bookResponse, categories, authors] =
                await Promise.all([
                    axios.get(
                        `${getApiUrl()}/books/${id}`,
                        getAuthConfig(req)
                    ),
                    getCategories(req),
                    getAuthors(req)
                ]);

            const book =
                getItemFromResponse(bookResponse.data);

            return res.render('books/edit', {
                title: 'Chỉnh sửa sách',
                book,
                categories,
                authors
            });
        } catch (error) {
            console.error(
                'Get edit book form error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/books');
        }
    }

    // POST /books/:id
    async update(req, res) {

        const { id } = req.params;

        try {
            await axios.put(
                `${getApiUrl()}/books/${id}`,
                getBookPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect('/books');
        } catch (error) {
            console.error(
                'Update book error:',
                error.response?.data ||
                error.message
            );

            return res.render('books/edit', {
                title: 'Chỉnh sửa sách',
                book: {
                    ...req.body,
                    id
                },
                categories: await getCategories(req).catch(() => []),
                authors: await getAuthors(req).catch(() => []),
                error:
                    'Không cập nhật được sách'
            });
        }
    }

    // POST /books/:id/delete
    async destroy(req, res) {

        const { id } = req.params;

        try {
            await axios.delete(
                `${getApiUrl()}/books/${id}`,
                getAuthConfig(req)
            );

            return res.redirect('/books');
        } catch (error) {
            console.error(
                'Delete book error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/books');
        }
    }
}

module.exports = new BookController();
