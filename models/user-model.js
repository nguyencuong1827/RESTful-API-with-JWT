var mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var user = new Schema({
  id: String,
  fullName: {
    type: String,
    required: true
  },
  nickName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  point: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    default: 'Đồng'
  }
}, { collection: 'users' });

const list = mongoose.model('users', user);

const saveUser = async (user) => {
  const newUser = new list(user);
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(newUser.password, salt, function (err, hash) {
      if (err) {
        console.log(err);
      }
      newUser.password = hash;
      newUser.save(function (err) {
        if (err) {
          console.log(err);
          return false;
        } else {
          return true;
        }
      });
    });
  });
};

const validPassword = async (username, password) => {
  const user = await list.findOne({ 'username': username });
  if (!user)
    return false;
  return await bcrypt.compare(password, user.password);
};

const checkUsername = async (username) => {
  const user = await list.findOne({ 'username': username });
  if (!user)
    return false; 
  return true;
};

const updateInfo = async (username ,fullName, nickName, res) => {
  const query = {'username': username};
  await list.findOneAndUpdate(query, 
                              {$set: {fullName: fullName, nickName: nickName}}, 
                              {upsert: true}, 
                              function(err, doc){
                                if(err){
                                  return res.status(400).json({
                                    error: err
                                  });
                                }
                                return res.status(200).json({
                                  message: 'Cập nhập thông tin thành công'
                                });
  });
};

const changePassword = async (username, password, newPassword, oldPassword, res) => {
  const query = {'username': username};
  const compare = await bcrypt.compare(oldPassword, password);
  
  if(!compare){
    return res.status(400).json({
      message: 'Mật khẩu cũ không chính xác'
    });
  }
  
  bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(newPassword, salt, async (err, hash) => {
        if (err) {
          return res.status(400).json({
            error: err
          });
        }
      await list.findOneAndUpdate(query, 
        {$set: {password: hash}}, 
        {upsert: true}, 
        function(err, doc){
          if(err){
            return res.status(400).json({
              error: err
            });
          }
          return res.status(200).json({
            message: 'Đổi mật khẩu thành công'
          });
      });
    });
  });
};



module.exports = {
  list: list,
  saveUser: saveUser,
  validPassword: validPassword,
  checkUsername: checkUsername,
  updateInfo: updateInfo,
  changePassword: changePassword
};