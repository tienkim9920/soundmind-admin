class AuthController {
  // 1. Hiển thị trang đăng nhập
  loginPage(req, res) {
    const rawAdminRoute = process.env.ADMIN_ROUTE || '/admin';
    const adminRoute = rawAdminRoute === '/' ? '' : rawAdminRoute.replace(/\/$/, '');

    res.render('auth/login', {
      title: 'Đăng nhập',
      routeUrl: adminRoute, // VD: '/admin'
      error: null
    });
  }

  // 2. Xử lý submit Form Đăng nhập (POST)
  async handleLogin(req, res) {
    const rawAdminRoute = process.env.ADMIN_ROUTE || '/admin';
    const adminRoute = rawAdminRoute === '/' ? '' : rawAdminRoute.replace(/\/$/, '');
    const apiUrl = process.env.API_URL || 'http://localhost:8080';

    const { username, password } = req.body;

    try {
      // Gọi tới backend API từ Express server
      const response = await fetch(`${apiUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      // Trường hợp đăng nhập thất bại
      if (data.code !== 200 || !data.data?.token) {
        return res.render('auth/login', {
          title: 'Đăng nhập',
          routeUrl: adminRoute,
          error: data.message || 'Tài khoản hoặc mật khẩu không chính xác.'
        });
      }

      // Đăng nhập thành công -> Lưu JWT vào Cookie HttpOnly
      res.cookie('token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 ngày
      });

      // Chuyển hướng vào trang quản lý
      return res.redirect(`${adminRoute}/books`);

    } catch (err) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        routeUrl: adminRoute,
        error: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.'
      });
    }
  }

  // 3. Xử lý Đăng xuất
  logout(req, res) {
    const rawAdminRoute = process.env.ADMIN_ROUTE || '/admin';
    const adminRoute = rawAdminRoute === '/' ? '' : rawAdminRoute.replace(/\/$/, '');

    res.clearCookie('token');
    return res.redirect(`${adminRoute}/login`);
  }
}

module.exports = new AuthController();
