//Login page

const user = require('../../models/user-model');
const passport = require('passport');

//Login process
exports.user_login_process = function(req, res, next) {
    passport.authenticate('local', { 
        failureRedirect: '/user/status',
        successRedirect:'/user/status',
        failureFlash: true 
        })(req,res,next);
}

//Register process
exports.user_register_process = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if(await user.checkUsername(username)){
        res.send(`Tài khoản ${username} đã tồn tại`);
        return;
    }
    
    let newUser = new user.list({
        username: username,
        password: password,
    });
    
    if (user.saveUser(newUser)) {
        res.send('Đăng ký thành công');
    }
};