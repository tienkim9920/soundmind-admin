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

function getCategoryPayload(body) {
    return {
        name: body.name,
        description: body.description
    };
}

class CategoryController {

    // GET /categories
    async index(req, res) {
        try {
            const response = await axios.get(
                `${getApiUrl()}/categories`,
                getAuthConfig(req)
            );

            const categories = getListFromResponse(response.data);

            return res.render('categories/index', {
                title: 'Quan ly the loai',
                categories
            });
        } catch (error) {
            console.error(
                'Get categories error:',
                error.response?.data ||
                error.message
            );

            return res.render('categories/index', {
                title: 'Quan ly the loai',
                categories: [],
                error: 'Khong tai duoc danh sach the loai'
            });
        }
    }

    // GET /categories/create
    create(req, res) {
        return res.render('categories/create', {
            title: 'Them the loai',
            category: {}
        });
    }

    // POST /categories
    async store(req, res) {
        try {
            await axios.post(
                `${getApiUrl()}/categories`,
                getCategoryPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect('/categories');
        } catch (error) {
            console.error(
                'Create category error:',
                error.response?.data ||
                error.message
            );

            return res.render('categories/create', {
                title: 'Them the loai',
                category: req.body,
                error: 'Khong tao duoc the loai'
            });
        }
    }

    // GET /categories/:id
    async show(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/categories/${id}`,
                getAuthConfig(req)
            );

            return res.json(getItemFromResponse(response.data));
        } catch (error) {
            console.error(
                'Get category detail error:',
                error.response?.data ||
                error.message
            );

            return res.status(error.response?.status || 500).json({
                message: 'Khong tai duoc the loai'
            });
        }
    }

    // GET /categories/:id/edit
    async edit(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/categories/${id}`,
                getAuthConfig(req)
            );

            const category = getItemFromResponse(response.data);

            return res.render('categories/edit', {
                title: 'Chinh sua the loai',
                category
            });
        } catch (error) {
            console.error(
                'Get edit category form error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/categories');
        }
    }

    // POST /categories/:id
    async update(req, res) {
        const { id } = req.params;

        try {
            await axios.put(
                `${getApiUrl()}/categories/${id}`,
                getCategoryPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect('/categories');
        } catch (error) {
            console.error(
                'Update category error:',
                error.response?.data ||
                error.message
            );

            return res.render('categories/edit', {
                title: 'Chinh sua the loai',
                category: {
                    ...req.body,
                    id
                },
                error: 'Khong cap nhat duoc the loai'
            });
        }
    }

    // POST /categories/:id/delete
    async destroy(req, res) {
        const { id } = req.params;

        try {
            await axios.delete(
                `${getApiUrl()}/categories/${id}`,
                getAuthConfig(req)
            );

            return res.redirect('/categories');
        } catch (error) {
            console.error(
                'Delete category error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/categories');
        }
    }
}

module.exports = new CategoryController();
