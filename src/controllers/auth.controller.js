class AuthController {
  loginPage(req, res) {
    res.render('auth/login', {
      title: 'Đăng nhập'
    });
  }
}

module.exports = new AuthController();