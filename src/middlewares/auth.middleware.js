
// Chuẩn hóa adminRoute để tránh thừa/thiếu dấu '/'
const rawAdminRoute = process.env.ADMIN_ROUTE || '/admin';
const adminRoute = rawAdminRoute === '/' ? '' : rawAdminRoute.replace(/\/$/, '');

/**
 * Trích xuất giá trị cookie từ Request
 */
function getCookieValue(req, name) {
    // Ưu tiên đọc từ req.cookies nếu có dùng cookie-parser
    if (req.cookies && req.cookies[name]) {
        return req.cookies[name];
    }

    // Đọc thủ công từ req.headers.cookie
    const cookieString = req.headers.cookie;
    if (!cookieString) return '';

    const cookie = cookieString
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${name}=`));

    if (!cookie) return '';
    return decodeURIComponent(cookie.slice(name.length + 1));
}

/**
 * Xác minh tính hợp lệ và chữ ký của JWT Token
 */
function verifyAdminToken(token) {
    if (!token) return false;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const payloadJson = Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);

        if (payload.role !== 'ADMIN') return false;
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;

        return payload;
    } catch (e) {
        return false;
    }
}

module.exports = {
    /**
     * Chặn các trang yêu cầu đăng nhập.
     * Nếu chưa có token hợp lệ -> Xóa cookie & Redirect về trang /login
     */
    protect: (req, res, next) => {
        const token = getCookieValue(req, 'token');
        const adminPayload = verifyAdminToken(token);

        if (adminPayload) {
            // Gắn thông tin Admin vào req.user để các controller đằng sau sử dụng
            req.user = adminPayload;
            return next();
        }

        // Token không hợp lệ hoặc không có -> Xóa cookie và đẩy về trang login
        res.clearCookie('token');
        const loginUrl = adminRoute === '' ? '/login' : `${adminRoute}/login`;
        return res.redirect(loginUrl);
    },

    /**
     * Ngăn không cho truy cập lại trang /login nếu ĐÃ đăng nhập thành công.
     * Nếu đã đăng nhập -> Redirect thẳng vào /books
     */
    redirectIfLoggedIn: (req, res, next) => {
        const token = getCookieValue(req, 'token');

        if (verifyAdminToken(token)) {
            return res.redirect(`${adminRoute}/books`);
        }

        next();
    }
};
