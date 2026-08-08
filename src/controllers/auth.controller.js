class AuthController {
  loginPage(req, res) {
    res.render('auth/login', {
      title: 'Đăng nhập',
      apiUrl: process.env.API_URL || 'http://localhost:8080',
      routeUrl: process.env.ADMIN_ROUTE || '/admin'
    });
  }
}

module.exports = new AuthController();