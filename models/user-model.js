const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

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
  },
  numberNegativePoint:{
    type: Number,
    default: 0
  },
  urlAvatar: {
    type: String,
    default: ''
  }
});


const list = mongoose.model('users', user, 'users');
const listRanking = mongoose.model('ranking', user, 'ranking');

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

const updateInfo = async (username ,fullName, nickName, urlAvatar,  res) => {
  const query = {'username': username};
  let set;
  if(urlAvatar === ''){
    set = { fullName: fullName, nickName: nickName };
  }
  else{
    set = { fullName: fullName, nickName: nickName, urlAvatar: urlAvatar };
  }

  await listRanking.findOneAndUpdate(query, {$set: set}, {useFindAndModify: false},  function(err, doc){
    console.log({err})
  });

  await list.findOneAndUpdate(query,
                              {$set: set},
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

const updatePointAndRank = async (username, newRank, newPoint, newNumberNegativePoint, res) => {
  const query = {'username': username};
  let set;
  set = { rank: newRank, point: newPoint, numberNegativePoint: newNumberNegativePoint };
  await list.findOneAndUpdate(query,
                              {$set: set},
                              {upsert: true},
                              function(err, doc){
                                if(err){
                                  console.log(err);
                                  return res.status(400).json({
                                    error: err
                                  });
                                }
                                return res.status(200).json({
                                  message: 'Cập điểm và hạng thành công'
                                });
  });


};

const updatePointAndRankOfListRanking =  async(username, newRank, newPoint, newNumberNegativePoint) => {
  const query = {'username': username};
  let set;
  set = { rank: newRank, point: newPoint, numberNegativePoint: newNumberNegativePoint };
  await listRanking.findOneAndUpdate(query,
                              {$set: set},
                              {upsert: true},
                              function(err, doc){
                                if(err){
                                  console.log(err);
                                }
  });
}

const addNewUserToListRanking = (user) => {
  const newUser = new listRanking(user);
  newUser.save(function (err) {
    if (err) {
      console.log(err);
      return false;
    } else {
      return true;
    }
  });
};


module.exports = {
  list: list,
  listRanking: listRanking,
  saveUser: saveUser,
  validPassword: validPassword,
  checkUsername: checkUsername,
  updateInfo: updateInfo,
  changePassword: changePassword,
  updatePointAndRank,
  addNewUserToListRanking,
  updatePointAndRankOfListRanking
};
