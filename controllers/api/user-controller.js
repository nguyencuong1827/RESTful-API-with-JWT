const User = require("../../models/user-model"),
  passport = require("passport"),
  jwt = require("jsonwebtoken");

//Login process
exports.user_login_process = (req, res, next) => {
  const {username, password} = req.body;

  if(!username || !password ){
    return res.status(400).json({
      message: "Vui lòng điền đủ thông tin"
    });
  }
  passport.authenticate("local-login", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.log(err);
        return res.status(400).json({
          message: info ? info.message : "Đăng nhập không thành công"
        });
      }

      
      req.login(user, { session: false }, (err) => {
        if (err) {
          return res.send(err);
        }
        const token = jwt.sign({ username: user.username }, process.env.TOKEN_SECRET);
        jwt
         res.header('auth-token', token);
         return res.json({
           token,
           user
          });
      });
    }
  )(req, res, next);
};

//Register process
exports.user_register_process = async (req, res) => {
  const {fullName, nickName ,username, password} = req.body;

  if(!username || !password || !fullName || !nickName){
    return res.status(400).json({
      message: "Vui lòng điền đủ thông tin"
    });
  }
 
  if (await User.checkUsername(username)) {
    return res.status(400).json({
      message: `Tài khoản ${username} đã tồn tại`
    });
  }

  let newUser = new User.list({
    fullName: fullName,
    nickName: nickName,
    username: username,
    password: password,
  });

  if (User.saveUser(newUser)) {
    return res.status(200).json({
      message: "Đăng ký thành công"
    });
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
           fullName: user.fullName,
           nickName: user.nickName,
           username: user.username,
           level: user.level
        });
    }
  })(req, res, next);
};

