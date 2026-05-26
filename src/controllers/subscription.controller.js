const axios = require('axios');

function getListFromResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.content)) return payload.data.content;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
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
        .map(item => item.trim())
        .find(item => item.startsWith(`${name}=`));

    if (!cookie) return '';

    return decodeURIComponent(cookie.slice(name.length + 1));
}

function getAuthConfig(req, config = {}) {
    const token =
        req.session?.token ||
        getCookieValue(req, 'token');

    if (!token) return config;

    return {
        ...config,
        headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`
        }
    };
}

function getSubscriptionPayload(body) {
    return {
        email: body.email,
        plan: body.plan,
        status: body.status,
    };
}

class SubscriptionController {

    // GET /subscriptions
    async index(req, res) {
        const {
            page = 0,
            size = 10,
            search = ''
        } = req.query;

        try {
            const response = await axios.get(
                `${getApiUrl()}/api/subscriptions/admin/list`,
                getAuthConfig(req, {
                    params: {
                        page,
                        size,
                        search
                    }
                })
            );

            console.log(
                'Get subscriptions response:',
                response.data
            );

            const result = response.data || {};
            const subscriptions = getListFromResponse(result);
            const currentPage = Number(page);
            const pageSize = Number(size);

            const pagination = {
                page: currentPage,
                size: pageSize,
                totalPages:
                    result.totalPages ||
                    currentPage + (subscriptions.length === pageSize ? 2 : 1),
                totalElements:
                    result.totalElements ||
                    subscriptions.length,
                hasNext:
                    result.hasNext ??
                    subscriptions.length === pageSize,
                hasPrevious:
                    result.hasPrevious ??
                    currentPage > 0
            };

            return res.render('subscriptions/index', {
                title: 'Quan ly subscription',
                subscriptions,
                pagination,
                filters: {
                    page,
                    size,
                    search
                }
            });
        } catch (error) {
            console.error(
                'Get subscriptions error:',
                error.response?.data ||
                error.message
            );

            return res.render('subscriptions/index', {
                title: 'Quan ly subscription',
                subscriptions: [],
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
                error: 'Khong tai duoc danh sach subscription'
            });
        }
    }

    // GET /subscriptions/create
    create(req, res) {
        return res.render('subscriptions/create', {
            title: 'Them subscription',
            subscription: {}
        });
    }

    // POST /subscriptions
    async store(req, res) {
        try {
            console.log("Subscription payload: ", getSubscriptionPayload(req.body));
            await axios.post(
                `${getApiUrl()}/api/subscriptions/admin`,
                getSubscriptionPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect('/subscriptions');
        } catch (error) {
            console.error(
                'Create subscription error:',
                error.response?.data ||
                error.message
            );

            return res.render('subscriptions/create', {
                title: 'Them subscription',
                subscription: req.body,
                error: 'Khong tao duoc subscription'
            });
        }
    }

    // GET /subscriptions/:id
    async show(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/api/subscriptions/admin/${id}`,
                getAuthConfig(req)
            );

            return res.json(
                getItemFromResponse(response.data)
            );
        } catch (error) {
            console.error(
                'Get subscription detail error:',
                error.response?.data ||
                error.message
            );

            return res.status(
                error.response?.status || 500
            ).json({
                message: 'Khong tai duoc subscription'
            });
        }
    }

    // GET /subscriptions/:id/edit
    async edit(req, res) {
        const { id } = req.params;

        try {
            const response = await axios.get(
                `${getApiUrl()}/api/subscriptions/admin/${id}`,
                getAuthConfig(req)
            );

            const subscription =
                getItemFromResponse(response.data);

            return res.render('subscriptions/edit', {
                title: 'Chinh sua subscription',
                subscription
            });
        } catch (error) {
            console.error(
                'Get edit subscription form error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/subscriptions');
        }
    }

    // POST /subscriptions/:id
    async update(req, res) {
        const { id } = req.params;

        try {
            await axios.put(
                `${getApiUrl()}/api/subscriptions/admin/${id}`,
                getSubscriptionPayload(req.body),
                getAuthConfig(req)
            );

            return res.redirect('/subscriptions');
        } catch (error) {
            console.error(
                'Update subscription error:',
                error.response?.data ||
                error.message
            );

            return res.render('subscriptions/edit', {
                title: 'Chinh sua subscription',
                subscription: {
                    ...req.body,
                    id
                },
                error: 'Khong cap nhat duoc subscription'
            });
        }
    }

    // POST /subscriptions/:id/delete
    async destroy(req, res) {
        const { id } = req.params;

        try {
            await axios.delete(
                `${getApiUrl()}/api/subscriptions/admin/${id}`,
                getAuthConfig(req)
            );

            return res.redirect('/subscriptions');
        } catch (error) {
            console.error(
                'Delete subscription error:',
                error.response?.data ||
                error.message
            );

            return res.redirect('/subscriptions');
        }
    }
}

module.exports = new SubscriptionController();