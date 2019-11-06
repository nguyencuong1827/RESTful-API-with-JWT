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
  autoReconnect: true,
  reconnectTries: 1000000,
  reconnectInterval: 3000
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



//Socket server
var arrUserWait = [];
var count = 0;
app.io.on('connection', function(socket){
  console.log(`Có người vừa truy cập: ${socket.id}`);
  socket.on('disconnect', function(){
    var index = arrUserWait.findIndex(function(item, i){
      return item.id === socket.id;
    });
    arrUserWait.splice(index, 1);
    console.log(`${socket.Username ? socket.Username : socket.id} vừa thoát`);
    io.sockets.in(socket.RoomName).emit('server-send-have-user-quit');
  });
  socket.on('user-send-username-point', function(data){
    socket.Username = data.Username;
    socket.NickName = data.NickName;
    socket.Point = data.Point;
    socket.RoomName = data.Username;
    socket.Rank = data.Rank;
    console.log( socket.Username);
    console.log("Điểm: "+socket.Point);

    const length = arrUserWait.length;
    if(length >= 1){
        
      socket.join(arrUserWait[length-1].RoomName);
      socket.RoomName = arrUserWait[length-1].RoomName;
      socket.YourTurn = 'O';
      arrUserWait.push({id: socket.id, Username: socket.Username, NickName: socket.NickName, Point: socket.Point, RoomName: socket.RoomName, Rank: socket.Rank, YourTurn: socket.YourTurn});
      io.sockets.in(socket.RoomName).emit('server-send-ready-play', 'Đã tạo phòng');
      io.sockets.in(socket.RoomName).emit('server-send-info-user', arrUserWait);
      arrUserWait = [];                       
    }
    else{
      arrUserWait.push({id: socket.id, Username: socket.Username, NickName: socket.NickName, Point: socket.Point, RoomName: socket.RoomName, Rank: socket.Rank, YourTurn: 'X'});
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
  socket.on('user-send-give-up', function(){
    io.sockets.in(socket.RoomName).emit('server-send-give-up', {Username: socket.Username, NickName: socket.NickName});
  });
  
  socket.on('user-send-message', function(data){
    io.sockets.in(socket.RoomName).emit('server-send-message', {Username: socket.Username, Message: data});
  });

  socket.on('user-send-play-again', function(data){
    console.log(data);
    io.sockets.in(socket.RoomName).emit('server-send-play-again', socket.Username);
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
