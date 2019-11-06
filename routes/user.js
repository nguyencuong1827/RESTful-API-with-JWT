var express = require('express');
var router = express.Router();
var user_controller = require ('../controllers/api/user-controller');
const passport = require('passport');
router.use(passport.initialize());
const logout = require('express-passport-logout')
/* GET users listing. */
router.post('/register', user_controller.user_register_process);

router.post('/login' ,user_controller.user_login_process);

router.get('/me', user_controller.user_info);

router.put('/update', user_controller.update_info);

router.put('/changePassword', user_controller.change_password);

module.exports = router;
