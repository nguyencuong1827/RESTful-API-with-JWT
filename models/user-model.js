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
  level: {
    type: Number,
    default: 0
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

module.exports = {
  list: list,
  saveUser: saveUser,
  validPassword: validPassword,
  checkUsername: checkUsername
};