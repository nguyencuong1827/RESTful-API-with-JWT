var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var bodyParser = require('body-parser');
var passport = require('passport')
var session = require('express-session');
var dotenv = require('dotenv');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var cors = require('cors');

var io = require("socket.io")();

var app = express();
app.io = io;

require('./config/passport')(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

dotenv.config();

//Kết nối cơ sở dữ liệu
var mongoose = require('mongoose');
mongoose.Promise = Promise;
const option = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // autoReconnect: true,
  // reconnectTries: 1000000,
  // reconnectInterval: 3000,
  useFindAndModify: true
};
const run = async () => {
  await mongoose.connect(process.env.DB_CONNECT, option);
}
run().catch(error => console.error(error));

// var whitelist = ['http://localhost:3000', 'https://game-caro-viet-nam.herokuapp.com']
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }


function changeRankToNumber(rank){
  switch(rank){
      case 'Đồng':{
          return 1;
      }
      case 'Bạc': {
          return 2;
      }
      case 'Vàng': {
          return 3;
      }
      case 'Bạch kim': {
          return 4;
      }
      case 'Kim cương': {
          return 5;
      }
      case 'Cao thủ': {
          return 6;
      }
      case 'Đại cao thủ': {
          return 7;
      }
      case 'Thách đấu': {
          return 8;
      }
      default:{
          return 0;
      }

  }
}
//Socket server
var arrRanking = [];
var arrUserWait = [];
var count = 0;
app.io.on('connection', function(socket){
  console.log(`Có người vừa truy cập: ${socket.id}`);
  io.sockets.emit('server-send-array-ranking', arrRanking);
  socket.on('disconnect', function(){
    var index = arrUserWait.findIndex(function(item, i){
      return item.id === socket.id;
    });
    arrUserWait.splice(index, 1);
    console.log(`${socket.Username ? socket.Username : socket.id} vừa thoát`);
    io.sockets.in(socket.RoomName).emit('server-send-have-user-quit', socket.YourTurn);
  });
  socket.on('user-send-info', function(data){
    socket.Username = data.Username;
    socket.NickName = data.NickName;
    socket.Point = data.Point;
    socket.RoomName = data.Username;
    socket.Rank = data.Rank;
    socket.urlAvatar = data.urlAvatar;
    console.log( socket.Username);
    console.log("Điểm: " + socket.Point);

    const length = arrUserWait.length;
    if(length >= 1){
        
      socket.join(arrUserWait[length-1].RoomName);
      socket.RoomName = arrUserWait[length-1].RoomName;
      socket.YourTurn = 'O';
      arrUserWait.push({id: socket.id, Username: socket.Username, NickName: socket.NickName, Point: socket.Point, RoomName: socket.RoomName, Rank: socket.Rank, urlAvatar: socket.urlAvatar, YourTurn: socket.YourTurn});
      io.sockets.in(socket.RoomName).emit('server-send-ready-play', 'Đã tạo phòng');
      io.sockets.in(socket.RoomName).emit('server-send-info-user', arrUserWait);
      arrUserWait = [];                       
    }
    else{
      socket.YourTurn = 'X';
      arrUserWait.push({id: socket.id, Username: socket.Username, NickName: socket.NickName, Point: socket.Point, RoomName: socket.RoomName, Rank: socket.Rank, urlAvatar: socket.urlAvatar, YourTurn: socket.YourTurn});
      socket.join(socket.RoomName);
    }
  });

  socket.on('user-send-position-move', function(data){
    socket.to(socket.RoomName).emit('server-send-position-move', data);
    //io.sockets.in(socket.RoomName).emit('server-send-position-move', data); 
  });
  
  socket.on('user-send-please-return', function(){
    io.sockets.in(socket.RoomName).emit('server-send-please-return', socket.Username);
  });
  socket.on('user-send-allow', function(){
    io.sockets.in(socket.RoomName).emit('server-send-allow'); 
  });
  socket.on('user-send-not-allow', function(){
    io.sockets.in(socket.RoomName).emit('server-send-not-allow', socket.Username); 
  });
  socket.on('user-send-give-up', function(){
    console.log(socket.YourTurn);
    io.sockets.in(socket.RoomName).emit('server-send-give-up', {Username: socket.Username, NickName: socket.NickName, YourTurn: socket.YourTurn});
  });
  
  socket.on('user-send-message', function(data){
    io.sockets.in(socket.RoomName).emit('server-send-message', {Username: socket.Username, Message: data});
  });

  socket.on('user-send-play-again', function(data){
    io.sockets.in(socket.RoomName).emit('server-send-play-again', socket.Username);
  });
  // Gửi điểm và hạng sau khi cập nhật
  socket.on('user-send-point-and-rank', function(data){
    console.log('Cập nhật điểm và hạng');
    let flag = 0;
    for(let i=0; i<arrRanking.length; i++){
      if(arrRanking[i].username === data.username){
        arrRanking[i] = data;
        flag = 1;
        break;
      }
    }
    if(flag === 0){
      arrRanking.push(data);
    }
    arrRanking.sort(function(a, b){
      if(changeRankToNumber(a.rank) === changeRankToNumber(b.rank)){
        return b.point - a.point;
      }
      return changeRankToNumber(b.rank) - changeRankToNumber(a.rank);
    });
    if(arrRanking.length > 10){
      arrRanking.pop();
    }
    io.sockets.emit('server-send-array-ranking', arrRanking);
    console.log('Bảng xếp hạng', data.username);
    console.log(arrRanking.length);
    // console.log(arrRanking);

  });
  socket.on('user-send-quit-room', function(){
    console.log(socket.NickName, " đã thoát khỏi phòng ", socket.RoomName);
    arrUserWait = [];
    io.sockets.in(socket.RoomName).emit('server-send-have-user-quit', socket.YourTurn); 
    socket.leave(socket.RoomName);
  });
});

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
// Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//app.use(passport.initialize());
//app.use(passport.session());



//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
//parse application/json
app.use(bodyParser.json());
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
