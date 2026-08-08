const axios = require('axios');

function getListFromResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.content)) return payload.data.content;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
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

    if (!cookie) return '';
    return decodeURIComponent(cookie.slice(name.length + 1));
}

function getAuthConfig(req, config = {}) {
    const token = getCookieValue(req, 'token');

    if (!token) return config;

    return {
        ...config,
        headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`
        }
    };
}

class OrderController {
    async index(req, res) {
        const {
            page = 0,
            size = 10,
            search = ''
        } = req.query;

        try {
            const response = await axios.get(
                `${getApiUrl()}/admin/orders`,
                getAuthConfig(req, {
                    params: {
                        page,
                        size,
                        search
                    }
                })
            );

            const result = response.data || {};
            const orders = getListFromResponse(result);
            const currentPage = Number(page);
            const pageSize = Number(size);

            const pagination = {
                page: currentPage,
                size: pageSize,
                totalPages:
                    result.totalPages ||
                    currentPage + (orders.length === pageSize ? 2 : 1),
                totalElements:
                    result.totalElements ||
                    orders.length,
                hasNext:
                    result.hasNext ??
                    orders.length === pageSize,
                hasPrevious:
                    result.hasPrevious ??
                    currentPage > 0
            };

            return res.render('orders/index', {
                title: 'Quan ly orders',
                orders,
                pagination,
                filters: {
                    page,
                    size,
                    search
                }
            });
        } catch (error) {
            console.error(
                'Get orders error:',
                error.response?.data ||
                error.message
            );

            return res.render('orders/index', {
                title: 'Quan ly orders',
                orders: [],
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
                error: 'Khong tai duoc danh sach orders'
            });
        }
    }
}

module.exports = new OrderController();
