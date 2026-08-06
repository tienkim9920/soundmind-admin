class AuthController {
  loginPage(req, res) {
    res.render('auth/login', {
      title: 'Đăng nhập',
      apiUrl: process.env.API_URL || 'http://localhost:8080'
    });
  }
}

module.exports = new AuthController();