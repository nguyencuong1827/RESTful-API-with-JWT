var express = require('express');
var router = express.Router();
var user_controller = require ('../controllers/api/user-controller');
const passport = require('passport');
router.use(passport.initialize());
const logout = require('express-passport-logout')
/* GET users listing. */
router.post('/register', user_controller.user_register_process);

router.post('/login', user_controller.user_login_process);

router.get('/me', user_controller.user_info);
module.exports = router;
