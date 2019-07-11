const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const schema = require('./database/schema.js');
const oracledbConfig = require('./database/oracledbConfig.js');
const oracledb = require('oracledb');
const multer = require('multer');
const multerS3 = require('multer-s3');

const AWS = require("aws-sdk");
AWS.config.loadFromPath("config/awsconfig.json");
const s3 = new AWS.S3();


const path = require('path');

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "lgtw-project-chat-bukit",
        key: function (req, file, cb) {
             let extension = path.extname(file.originalname);
             cb(null, Date.now().toString() + extension);
        },
        acl: 'public-read-write',
    })
});

router.post('/upload', upload.array('files'), (req, res) => {
	console.log(req.files);
	console.log(req.body);

	schema.insertMany({'message':{
						'roomId':req.body.roomId,
						'send_user':req.body.userId,
						'send_userName':req.body.userName,
						'message_at':new Date().getTime(),
						'file_items':{file_path:req.files[0].location,
									  origin_name:req.files[0].originalname,
									  size:req.files[0].size}
						}}, (err,result) =>{
							console.log(result);
		schema.find({'room_log.room_objectId':req.body.roomId}, (err,result) =>{
			console.log(result);
			for(var i=0; i<result.length; i++){
				if(result[i].room_log.room_user != req.body.userId){
					schema.insertMany({'message_log.receiper':result[i].room_log.room_user,
									   'message_log.roomId':req.body.roomId
										}, (err, result) =>{
							schema.updateMany({'room_log.room_objectId':req.body.roomId},{$set:{'room_log.end_message':new Date().getTime()}}, (err,result) =>{
							//console.log(result);
							});											
					});
				}
			}
		});						
	});
	res.send(req.files[0]);
  });

router.post('/', (req, res) => {
  	req.session.userId = req.body.hidden1;
    req.session.userName = req.body.hidden2;
    res.render('lobby.html',{session:req.session});
});

router.get('/', function(req, res){
	res.render('lobby.html',{session:req.session});
});

//몽고에서 방정보 리턴 및 인설트
router.post("/insertRoom", (req, res) => {

	var creatUserId = req.body.creatUserId;
	var roomId;

	schema.find({$and:[{'room.chatUser':{$size:'2'}},{'room.chatUser':{$all:req.body.users}}]}
	  	 , (err,room) => {

		if(room != ""){
			console.log("개인 룸이있네?");
			console.log(room[0].id);
			roomId = room[0].id;
			console.log(creatUserId);

			schema.find({$and:[{'room_log.room_user':creatUserId},{'room_log.room_objectId':roomId}]}, (err, result) =>{
			console.log(result);
				if(result.length == 0 ){
					console.log("들어옴?");
					schema.insertMany({'room_log':{
						'room_objectId':roomId,
						'user_log':new Date().getTime(),
						'room_user':creatUserId,
						'room_name':req.body.roomName[1] + '님과의 채팅방'
						 }}, (err,result) => {
							sendRoom(roomId);
					 });
				}else{
					sendRoom(roomId);
				}
				
				 
			}); 
			
			//res.send(room);
		}else{
			schema.insertMany({'room':{
			'roomName':req.body.roomName,        
			'creatUserId':req.body.creatUserId, 
			'chatUser':req.body.users,
			'room_type':req.body.roomType
			}}, (err, result) => { 
			console.log("인설트성공 : " + result);
			roomId = result[0].id;
			if(req.body.chatName != undefined){
				for(var i=0; i<req.body.users.length; i++){
					schema.insertMany({'room_log':{
								'room_objectId':result[0].id,
								'user_log':new Date().getTime(),
								'room_user':req.body.users[i],
								'room_name':req.body.chatName
					 }}, (err,result) => {
					 });}
			}else{
			for(var i=0; i<req.body.users.length; i++){
			schema.insertMany({'room_log':{
			 			'room_objectId':result[0].id,
						'user_log':new Date().getTime(),
						 'room_user':req.body.users[i],
						 'room_name':req.body.roomName[i] + '님과의 채팅방'
			 }}, (err,result) => {

			 });}}
			 schema.find({'_id':roomId}, (err,result) => {
			 //console.dir(result);
			 res.send(result);
			 });
			 });
		}
	});
	
	function sendRoom(roomId) {
		schema.find({'_id':roomId}, (err,result) => {
			//console.dir(result);
			res.send(result);
			});
	}
});	
			// schema.insertMany({'room':{
			// 	'roomName':req.body.roomName,        
			// 	'creatUserId':req.body.creatUserId,
			// 	'chatUser':req.body.users
			// }}, (err, result) => {
			// console.log("인설트성공 : " + result);
			// roomId = result[0].id;
			// for(var i=0; i<req.body.users.length; i++){
			// schema.insertMany({'room_log':{
			// 			'room_objectId':result[0].id,
			// 			'user_log':new Date().getTime(),
			// 			'room_user':req.body.users[i]
			// }}, (err,result) => {

			// });}
			// schema.find({'_id':roomId}, (err,result) => {
			// console.dir(result);
			// res.send(result);
			// });
			// });
			
		//});
		//{'room.chatUser': {$in:req.body.users}}
		//{$and: [{'room.chatUser': {$in:req.body.users[0]}}]
		//{ $where: 'room.chatUser.length == 2' }
		//,{'room.chatUser':{$size:'2'}}]}

	



//오라클에서 유저정보 리턴
router.post('/getUser', (req,res)=> {
	oracledb.getConnection({
		user:oracledbConfig.user,
		password:oracledbConfig.password,
		connectString:oracledbConfig.connectString //oracle설치할때 지정한 이름(파일명으로 확인가능)
	},function(err,con){
		if(err){
			console.log("접속이 실패했습니다.",err);
		}
		var query ="SELECT E.EMP_ID, E.EMP_NAME, J.JOB_NAME, D.DEPT_NAME FROM EMPLOYEE E JOIN PROMOTION_HISTORY PH ON(E.EMPNO = PH.EMPNO) JOIN JOB J ON(PH.JOB_CODE = J.JOB_CODE) JOIN DEPT_HISTORY DH ON(E.EMPNO = DH.EMPNO) JOIN DEPT D ON(DH.DEPT_CODE = D.DEPT_CODE) ORDER BY DEPT_NAME,JOB_LEVEL ASC";
		con.execute(query, function(err, result){
			if(err) {
				console.error(err.message);
	
				doRelease(con);
				return;
			}	
			console.log(result.rows);
			doRelease(con, result.rows);
		});		
	});
	
	function doRelease(connection, userList){
		
		connection.close(function(err){
			if(err){
				console.error(err.message);
			}
			//console.log('list size' + userList.length);
			res.send(userList);
		});
	}
});

//메세지 insert
router.post('/insertMessage', (req,res) => {
	console.log("들어오냐");
	console.log(req.body);
	var roomId = req.body.messageInfo.roomId;
	var sendUser = req.body.messageInfo.send_user;

	  schema.insertMany({'message':{
										 'roomId':req.body.messageInfo.roomId,
										 'content':req.body.messageInfo.content,
										 'message_at':new Date().getTime(),
										 'send_user':req.body.messageInfo.send_user,
										 'send_userName':req.body.messageInfo.send_userName	  
	  }}, (err, result) =>{ 
		schema.find({'_id':roomId}, (err,result) =>{
			console.log(result);
			//console.log(result[0].room.chatUser[0]);

		 	for(var i=0; i<result[0].room.chatUser.length; i++){
		 		if(sendUser != result[0].room.chatUser[i]){
		 		schema.insertMany({'message_log':{
		 											'roomId':roomId,
		 											'receiper':result[0].room.chatUser[i]
		 		}}, (err,result) =>{
		 			schema.updateMany({'room_log.room_objectId':roomId},{$set:{'room_log.end_message':new Date().getTime()}}, (err,result) =>{
						console.log(result);
					 });
		 		});
		 	}
		 }
		});
		
	  });
});

//메세지 조회
router.get('/getMessage/:roomId', (req,res) =>{
	console.log("출력확인");
	console.log(req.params.roomId);
	var roomId = req.params.roomId;
	schema.find({'message.roomId':roomId}, (err,result) => {
		console.log(result);
		res.send(result);
	});


});

router.get("/showChatList/:userId", (req,res) => {

	var userId = req.params.userId;
	//,{$sort:{'room_log.end_message':-1}
	schema.find({'room_log.room_user':userId}).sort({'room_log.end_message':-1}).exec((err,result) => {
		res.send(result);
	});
	
		//  schema.find({ $and: [{'message_log.roomId':elements.room_log.room_objectId},
		// 						  {'message_log.receiper':userId}]}, (err, result) =>{
		// 		if(result.length == 0){	 
		// 			elements.room_log.totalCount = 0;
		// 		}	
		// 		 }else{
		// 			elements.room_log.totalCount = result.length;
		// 		 }
		// 		 if(index == roomInfo.length){
		// 			 callback(roomInfo);
		// 		 }
				 
	
		 //res.send(totalInfo);
	
});

router.get("/roomName/:roomId/:userId", (req, res) => {
	console.log("들어옴^^");
	console.log(req.params);
	 schema.find({$and : [{'room_log.room_objectId':req.params.roomId},{'room_log.room_user':req.params.userId}]}, (err,result ) => {
	 	res.send(result);
	 });

});

router.get("/getNreadCount/:roomId/:userId", (req,res) => {

	schema.find({$and: [{'message_log.roomId':req.params.roomId},{'message_log.receiper':req.params.userId}]}, (err, result) =>{
		if(result.length == 0){
			res.send('0');
		}else{
			res.send(result);
		}
	});
});

router.post("/deleteRoom" , (req, res) => {
	console.log(req.body);

	schema.remove({$and:[{'room_log.room_objectId':req.body.roomId},{'room_log.room_user':req.body.userId}]}, (err,result) =>{
		console.log(result);
	})
});

router.post("/readMessage", (req, res) => {
	console.log("읽은 쪽지 로그 삭제");
	console.log(req.body);

	schema.remove({$and: [{'message_log.roomId':req.body.roomId},{"message_log.receiper":req.body.userId}]}, (err,result) => {
		res.send(result);
	});
});

router.get("/checkUsers/:roomId", (req, res) =>{
	console.log("hh");
	schema.find({'room_log.room_objectId':req.params.roomId}, (err, result) =>{
		res.send(result);
	});
});

router.post("/addUser", (req, res) =>{
	console.log(req.body);

	schema.find({"_id":req.body.roomId}, (err, result) =>{
		if(result[0].room.room_type == '1'){
			schema.insertMany({'room':{
				'roomName':req.body.chatUserName,        
				'creatUserId':req.body.creatUserId,
				'chatUser':req.body.chatUsers,
				'room_type':req.body.room_type	
				}}, (err, result) => { 
				console.log("인설트성공 : " + result);
				roomId = result[0].id;
				
					for(var i=0; i<req.body.chatUsers.length; i++){
						schema.insertMany({'room_log':{
									'room_objectId':result[0].id,
									'user_log':new Date().getTime(),
									'room_user':req.body.chatUsers[i],
									'room_name':req.body.chatUserName.join(",") + '님의 채팅방'
						 }}, (err,result) => {

						 });}
				
				 schema.find({'_id':roomId}, (err,result) => {
				 //console.dir(result);
				 });
				 });
		}else{
			for(var i=0; i<req.body.addUser.length; i++){
				schema.insertMany({'room_log':{
							'room_objectId':req.body.roomId,
							'user_log':new Date().getTime(),
							'room_user':req.body.addUser[i],
							'room_name':req.body.roomName

				 }}, (err,result) => {

				 });}
		}
	});
});



module.exports = router;