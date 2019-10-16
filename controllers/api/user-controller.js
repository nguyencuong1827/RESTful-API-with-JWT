const User = require("../../models/user-model"),
  passport = require("passport"),
  jwt = require("jsonwebtoken");

var currentUser = null;
//Login process

const checkToken = (token, user) => {
  
}

exports.user_login_process = (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  if(!username || !password){
    return res.send('Vui lòng điền đầy đủ thông tin tài khoản');
  }
  passport.authenticate("local-login", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.log(err);
        return res.status(400).json({
          message: info ? info.message : "Đăng nhập không thành công"
        });
      }

      currentUser = user;
      req.login(user, { session: false }, (err) => {
        if (err) {
          return res.send(err);
        }
        const token = jwt.sign({ username: user.username }, process.env.TOKEN_SECRET);
        jwt
         res.header('auth-token', token);
         return res.json({
           message: 'Đăng nhập thành công',
           token
          });
      });
    }
  )(req, res, next);
};

//Register process
exports.user_register_process = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if(!username || !password){
    return res.send('Vui lòng điền đầy đủ thông tin tài khoản');
  }
  if (await User.checkUsername(username)) {
    return res.send(`Tài khoản ${username} đã tồn tại`);
  }

  let newUser = new User.list({
    username: username,
    password: password
  });

  if (User.saveUser(newUser)) {
    return res.send("Đăng ký thành công");
  }
};

//Info of the user who has just logged in
exports.user_info = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    
    if (info) {
      return res.status(400).json({
        message: info.message
      });

    }
    else{
        return res.status(200).json({
            user
        });
    }
  })(req, res, next);
};

