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

function getCategoryId(category) {
    return category.id ?? category._id ?? category.categoryId;
}

function getCategoryName(category) {
    return category.name ?? category.title ?? category.categoryName ?? category.slug ?? `#${getCategoryId(category)}`;
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

            const API_URL =
                process.env.API_URL || 'http://localhost:8080';

            const [booksResponse, categoriesResponse] =
                await Promise.all([

                    axios.get(
                        `${API_URL}/api/books`,
                        {
                            params: {
                                page,
                                size,
                                search,
                                categoryId
                            }
                        }
                    ),

                    axios.get(
                        `${API_URL}/api/categories`
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
    create(req, res) {
        res.render('books/create', {
            title: 'Thêm sách'
        });
    }

    // POST /books
    store(req, res) {

        const data = req.body;

        console.log('Book create:', data);

        return res.redirect('/books');
    }

    // GET /books/:id
    show(req, res) {

        const { id } = req.params;

        res.send(`Book detail ${id}`);
    }

    // GET /books/:id/edit
    edit(req, res) {

        const { id } = req.params;

        res.render('books/edit', {
            title: 'Chỉnh sửa sách',
            id
        });
    }

    // POST /books/:id
    update(req, res) {

        const { id } = req.params;

        console.log('Update book', id);

        return res.redirect('/books');
    }

    // POST /books/:id/delete
    destroy(req, res) {

        const { id } = req.params;

        console.log('Delete book', id);

        return res.redirect('/books');
    }
}

module.exports = new BookController();
