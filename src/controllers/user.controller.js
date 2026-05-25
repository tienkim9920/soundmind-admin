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

function getUserPayload(body, includePassword = false) {
    const payload = {
        username: body.username,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        cccd: body.cccd,
        avatar: body.avatar,
        role: body.role
    };

    if (includePassword || body.password) {
        payload.password = body.password;
    }

    return payload;
}

class UserController {

    // GET /users
    async index(req, res) {
        const {
            page = 0,
            size = 10,
            search = ''
        } = req.query;

        try {
            const response = await axios.get(
                `${getApiUrl()}/api/users`,
                getAuthConfig(req, {
                    params: {
                        page,
                        size,
                        search
                    }
                })
            );

            const usersResult = response.data;
            const users = getListFromResponse(usersResult);

            const pagination = {
                page: Number(page),
                size: Number(size),
                totalPages: usersResult.totalPages || 1,
                totalElements: usersResult.totalElements || users.length,
                hasNext: usersResult.hasNext || false,
                hasPrevious: usersResult.hasPrevious || false
            };

            return res.render('users/index', {
                title: 'Quan ly nguoi dung',
                users,
                pagination,
                filters: {
                    page,
                    size,
                    search
                }
            });
        } catch (error) {
            console.error(
                'Get users error:',
                error.response?.data ||
                error.message
            );

            return res.render('users/index', {
                title: 'Quan ly nguoi dung',
                users: [],
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
                error: 'Khong tai duoc danh sach nguoi dung'
            });
        }
    }

    // GET /users/create
    create(req, res) {
        return res.render('users/create', {
            title: 'Them nguoi dung',
            user: {}
        });
    }

    // POST /users
    async store(req, res) {
        try {
            await axios.post(
                `${getApiUrl()}/api/users`,
                getUserPayload(req.body, true),
                getAuthConfig(req)
            );

            return res.redirect('/users');
        } catch (error) {
            console.error(
                'Create user error:',
                error.response?.data ||
                error.message
            );

            return res.render('users/create', {
                title: 'Them nguoi dung',
                user: req.body,
                error: 'Khong tao duoc nguoi dung'
            });
        }
    }

    // GET /users/:id
    async show(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/api/users/${id}`,
                getAuthConfig(req)
            );

            return res.json(getItemFromResponse(response.data));
        } catch (error) {
            console.error(
                'Get user detail error:',
                error.response?.data ||
                error.message
            );

            return res.status(error.response?.status || 500).json({
                message: 'Khong tai duoc nguoi dung'
            });
        }
    }

    // GET /users/:id/edit
    async edit(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/api/users/${id}`,
                getAuthConfig(req)
            );

            const user = getItemFromResponse(response.data);

            return res.render('users/edit', {
                title: 'Chinh sua nguoi dung',
                user
            });
        } catch (error) {
            console.error(
                'Get edit user form error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/users');
        }
    }

    // POST /users/:id
    async update(req, res) {
        const { id } = req.params;

        try {
            await axios.put(
                `${getApiUrl()}/api/users/${id}`,
                getUserPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect('/users');
        } catch (error) {
            console.error(
                'Update user error:',
                error.response?.data ||
                error.message
            );

            return res.render('users/edit', {
                title: 'Chinh sua nguoi dung',
                user: {
                    ...req.body,
                    id
                },
                error: 'Khong cap nhat duoc nguoi dung'
            });
        }
    }

    // POST /users/:id/delete
    async destroy(req, res) {
        const { id } = req.params;

        try {
            await axios.delete(
                `${getApiUrl()}/api/users/${id}`,
                getAuthConfig(req)
            );

            return res.redirect('/users');
        } catch (error) {
            console.error(
                'Delete user error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/users');
        }
    }
}

module.exports = new UserController();
