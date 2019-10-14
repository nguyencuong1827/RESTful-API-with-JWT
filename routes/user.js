var express = require('express');
var router = express.Router();
var user_controller = require ('../controllers/api/user-controller');
const passport = require('passport');
router.use(passport.initialize());
/* GET users listing. */
router.post('/register', user_controller.user_register_process);

//router.post('/login', user_controller.user_login_process, user_controller.user_login_mess);
router.post('/login', passport.authenticate('local-login', { failureRedirect: '/user/fail' }),
function(req, res) {
  res.redirect('/user/success?username=' + req.user.username);
});

router.get('/success', function(req, res){
  res.send(`Chào mừng ${req.query.username}!!!`);
});
router.get('/fail', function(req, res){
  res.send(`Tài khoản hoặc mật khẩu không đúng`);
});

module.exports = router;
