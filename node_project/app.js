const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const db = require('./database/mongodb.js');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const route = require('./route.js');
//익스프레스 객체 생성
var app = express();
app.engine('html',require('ejs').renderFile);
app.set('view engin','text');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
//기본 속성 설정

db();

app.use(session({
 secret: '@#@$MYSIGN#@$#$',
 resave: false,
 saveUninitialized: true
}));

app.use('/', route);

app.use('/script',express.static(__dirname + '/script'));
app.use('/public',express.static(__dirname + '/public'));
app.use('/views',express.static(__dirname + '/views'));
app.use('/database',express.static(__dirname + '/database'));
app.use('/uploads',express.static(__dirname + '/uploads'));
app.use('/config',express.static(__dirname + '/config'));

app.set('port',process.env.PORT || 3000);


var server = http.createServer(app).listen(app.get('port'), function(){
   console.log("익스프레스 서버 시작 : " + app.get('port'));
});

var io = socketio.listen(server);

var login_ids = {};
var socket_rooms = {};

console.log("socket 활성");

io.sockets.on('connection', function(socket){
    console.log('connection info :' + socket.request.connection._peername); 
//     socket.remoteAddress = socket.request.connection._peername.address;
//     socket.remotePort = socket.request.connection._peername.port;

	//로그인 이벤트
	socket.on('login', function(data){
		console.dir('로긴이벤트 : ' + data);
		login_ids[data] = socket.id;
		console.dir(login_ids);
	});

	//방 이벤트
	socket.on('room', function(room){
		console.log("room : " + room);
		var userId = room.creatUserId;

		if(room.commend == 'create' || room.commend == 'join'){
			   if(io.sockets.adapter.rooms[room.id]){
				socket.join(room.id);

				console.dir(io.sockets.adapter.rooms[room.id]);

				//io.to(login_ids[userId]).emit('check', 'check');
			}else{	
				
				socket.join(room.id);
				
				// var curRoom = io.sockets.adapter.rooms[room.id];
				// curRoom.id = room.id;
				// curRoom.roomName = room.roomName;
				// curRoom.cteatUserId = room.creatUserId;
				// curRoom.users = room.users;
				
				console.log("hh");
				console.log(io.sockets.adapter.rooms[room.id]);

				//io.to(login_ids[userId]).emit('check', 'check');
			}
		}else if(room.commend == 'close'){
			socket.leave(room.id);
		}				   
	});
	
	//메세지 이벤트
    socket.on('message', function(message){

    console.log("message 이벤트를 받았다"); 
	console.log("룸아이디 : " + message.roomId);
	
	socket.broadcast.to(message.roomId).emit('message', message);
   	
	});

	socket.on('onlineCheck',function(data){
		
		if(login_ids[data]){
			io.emit('onlineCheck',{online:'online_icon',data:data});
		}else{
			io.emit('onlineCheck',{online:'online_icon offline',data:data});
		}
		
		
	});
	
	
    
});

	


