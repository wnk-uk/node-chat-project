
	var userId;
	var userName;
	var roomId;

	//소켓 연결
	var socket;
	var host = "localhost";
	var port = "3000";
	var url = 'http://' + host + ':' + port;
	var option = {'forceNew' : true};
	socket = io.connect(url, option);
	
	$(function(){

		$('#action_menu_btn').click(function(){
			$('.action_menu').slideToggle();
		});

		$(".plusBtn").click(function(){
			$(".modalBtn").click();
		});

		$(".msg_card_body").on('DOMSubtreeModified',function(){		
			$(this).animate({
				scrollTop: this.scrollHeight - this.clientHeight
			},0);
		});

		 $(".btn-default").click(function(){
		 	$("#chatName").val("");
			 $('input[type=checkbox]:checked').prop("checked",false);
			 $(".modalBtn").click();
		 });

		 $(".fa-paperclip").click(function(){
			$(".upload").click();
		 });

		 $(".upload").change(function(){
			
			// var form = $(".fileform")[0]; 
			// formData.append('files',form.files);
			// console.log(form.files);

			var form = $('.fileform')[0];
			var formData = new FormData(form);
			formData.append('roomId',roomId);
			formData.append('userId',userId);
			formData.append('userName',userName);

			$.ajax({
				url:"/upload",
				type:"POST",
				enctype:"multipart/form-data",
				data:formData,
				processData: false,
        		contentType: false,
				success: (data) =>{
					console.log("으이구");
					console.log(data);

					messageInfo = {
									file_items:[{file_path:data.location,
												 origin_name:data.originalname,
												 size:data.originalname.size}],
									messageType:'file',
									roomId:roomId,
									message_at:new Date().getTime(),
									send_user:userId,
									send_userName:userName
									}
					socket.emit('message',messageInfo);				
					reqFile(messageInfo);
				},
				error : (data) =>{

				}
			});

		 });

		//  $(".fileform").on('DOMSubtreeModified',function(){		
		// 	var log = document.getElementsByName("files");
		// 	console.log(log.value);			
		// });
		

		//팝업
		
	});
	

	function clearUser(clearUserId, clearUserName){
		userId = clearUserId;
		userName = clearUserName;
		socket.emit('login',userId);
	}

	


	function showUserList(){
		
		$(".plusBtn").css("display","none");
	$.ajax({
		url:"/getUser",
		type:"post",
		success:function(data){
			console.log(data);
			$(".fa-user").css("color","black");
			$(".fa-comment-dots").css("color","white");
			var $content = $(".contacts");
			$content.empty();
			var $modalUser = $("#modal_user");
			$modalUser.empty();
			for(var i=0; i<data.length; i++){
				if(userId != data[i][0]){
					
					//online_icon offline
					$content.append('<li>' +
									'<div class="d-flex bd-highlight" onclick="viewChatRoom(this)" id=' + data[i][0] + '>' +
									'<div class="img_cont">' +  
									'<img src="/public/users.png" class="rounded-circle user_img">' + 
									'<span class=' + onlineCheck(data[i][0]) + '></span>' + 
									'</div>' + 
									'<div class="user_info">' + 
									'<span id="userInfo">' + data[i][1] + '(' + data[i][3] + ') ' + '-' + data[i][2] + '</span>' + 
									'<p>'+ data[i][1]  +' is online</p>' +
									'</div>' +
									'</div>' +
									'</li>');
					
					$modalUser.append('<tr>' + '<td>' + '<input type="hidden" value='+ data[i][0] + '>' + '</td>' +
					'<td>'+ data[i][1] + '(' + data[i][3] + ') ' + '-' + data[i][2] +'</td>' + '<td>' +
									  '<input type="checkbox">' + '</td>' + '</tr>');

				}else{
					$content.prepend('<li class="active">' +
									'<div class="d-flex bd-highlight">' +
									'<div class="img_cont">' +  
									'<img src="/public/users.png" class="rounded-circle user_img">' + 
									'<span class="online_icon"></span>' + 
									'</div>' + 
									'<div class="user_info">' + 
									'<span id="userInfo">' + data[i][1] + '(' + data[i][3] + ') ' + '-' + data[i][2] + '</span>' + 
									'<p>'+ data[i][1]  +' is online</p>' +
									'</div>' +
									'</div>' +
									'</li>');
				}

			}
			
		},
		error:function(status){
			console.log("에러");
		}

	});
	

	}

	//채팅방 보여줌
	function viewChatRoom(div){
		var chatUserName = $("#" + div.id).children(".user_info").children().text().split("(")[0];
		users = [div.id,userId];
		var roomUserName = [userName,chatUserName];
		showChatList();
		createRoom(userId,roomUserName,users,undefined,1);
	}


	//방생성 및 조인
	function createRoom(userId, roomUserName, users, chatName,roomType){
		console.log(chatName);
		if(chatName == undefined){
			var roominfo = {
				creatUserId:userId,
				roomName:roomUserName,
				users:users,
				roomType:roomType
			}
		}else{
			var roominfo = {
				creatUserId:userId,
				roomName:roomUserName,
				users:users,
				chatName:chatName,
				roomType:roomType
			}
		}
		
		console.log("방정보");
		console.dir(roominfo);

		  $.ajax({
		 	url:"/insertRoom",
		 	 type:"post",
		 	 data:roominfo,
		 	 success:function(data){
				console.log("방정보조회"); 

		 		console.log("_id : " + data[0]._id);
		 		roomId = data[0]._id;
		 		roominfo.id = data[0]._id;
		 		roominfo.commend = 'create';

				
				changeView();
				getMessage(roomId);

				socket.emit('room', roominfo);
				
				
				
		 		// socket.on('check', function(message){
				// 	if(message == 'check'){
						
				// 	}
				// });		
		 	 },
			 error:function(status){
		 		 console.log("에러");
		 	 }
		  });
	}

	function changeView(){
		 $(".contacts_card").css("display","none !important");
		 $(".contacts_body").css("display","none");
		 $(".card").slideToggle(400);
		// $(".contacts_card").toggle();
		// $(".contacts_body").toggle();
		//$(".card").toggle();
	}


	//메세지 전송
	function sendMessage(){
	
		var messageInfo = {						
							 content:$("#chatInput").val(),
							 send_user:userId,
							 send_userName:userName,
							 roomId:roomId,
							 message_at:new Date().getTime()
						  }
		console.log(messageInfo);
		socket.emit('message',messageInfo);
		reqMessage(messageInfo);
		
		$.ajax({
			url:"insertMessage",
			type:"post",
			data:{messageInfo:messageInfo},
			success:function(data){
				console.log(data);
				
			},
			error:function(status){
				console.log("에라");
			}
			

		});
		$("#chatInput").val("");						
	}


	

	//서버로 부터 메세지 전달받음
	socket.on('message', function(message){
		console.log("메세지 받음" + message);
		if(message.messageType == 'file'){
			resFile(message);
		}else{
			resMessage(message);
		}
		
	});

	//받은 메세지를 채팅창에 띄움
	function resMessage(message){
		console.log();
		//'<img src="#" class="rounded-circle user_img_msg">'
		$(".msg_card_body").append('<div class="d-flex justify-content-start mb-4">' + 
										'<span class="img_cont_msg" style="color:white; font-size:12px;">' 
											+ message.send_userName + 
										'</span>' + 
										'<div class="msg_cotainer">' +
										message.content +  
										 '<span class="msg_time">' + makeDate(message.message_at) + '</span>' + 
										'</div>' + 
									'</div>');
	}

	//보낸 메세지를 채팅창에 띄움
	function reqMessage(message){
		console.log(message);
		$(".msg_card_body").append('<div class="d-flex justify-content-end mb-4">' +
		'<div class="msg_cotainer_send">' +
		message.content
		+ '<span class="msg_time_send">' + makeDate(message.message_at) + '</span>' +
		'</div>' +
		'</div>');
	}

	//데이트를 만들어서 리턴
	function makeDate(time){
		var date = new Date(Number(time));
		var am = 'AM';
		var minutes = date.getMinutes();

		if(date.getHours > 12){
			am = 'PM';
		}

		if(minutes < 9){
			minutes = "0"+ minutes;
		}

		return am + date.getHours() + ":" + minutes;
	}

	//채팅방에 메세지 가져옴
	function getMessage(roomId){
		console.log(roomId);
		var userLog = $("#"+roomId).siblings().val();
		console.log(userLog);
		var count = 0;
		
		$(".msg_card_body").empty();
		$.ajax({
			url:"getMessage/" + roomId,
			type:"get", 
			success:function(data){
				
				console.log(data);
				for(var i=0; i<data.length; i++){

					if(Number(userLog) < Number(data[i].message.message_at)){
						count++;
						if(data[i].message.send_user == userId){
							console.log("들어온친구 : " + data[i]);
							if(data[i].message.file_items.length == 0){
								reqMessage(data[i].message);
							}else{
								reqFile(data[i].message);
							}
							
						}else{
							if(data[i].message.file_items.length == 0){
								resMessage(data[i].message);
							}else{
								resFile(data[i].message);
							}
							
						}
					}		
				}
				$(".chatNum").text(count + ' Messages').css("color","black");
				getRoomName(roomId,userId);
			},
			error:function(stauts){
				console.log("에러");
			}
		});
	};
	
	//방리스트 조회
	function showChatList() {
		
		$.ajax({
			url:"showChatList/" + userId,
			type:"get",
			success: function(data){
				console.log(data);
				chatList(data);
				$(".fa-user").css("color","white");
				$(".fa-comment-dots").css("color","black");
			},
			error: (status) => {
				console.log(status);
			}
		});
	}

	//방리스트 조회
	function chatList(roomList){
		console.log(roomList);
		var count = 0;
		var count_list = new Array();
		$(".plusBtn").css("display","inline");
		var $content = $(".contacts");
			$content.empty();
		
			for(var i=0; i<roomList.length; i++){
				var roomId = roomList[i].room_log.room_objectId;
					$content.append('<li>' +
									'<div class="d-flex bd-highlight" onclick="viewChat(this)" id=' + roomList[i].room_log.room_objectId + '>' +
									'<div class="user_info">' + 
									'<span id="userInfo">' + roomList[i].room_log.room_name + '</span>' + 
									'<label id='+ "user" + i + ' style="margin-left:10px; color:salmon; font-weight:bold">'+ 
									 +'</label>' + 
									'<p></p>'+
									'</div>' +
									'</div>' +
									'<input type="hidden" value=' + roomList[i].room_log.user_log + '>' + 
									'</li>');

				getNreadCount(i,roomList[i].room_log.room_objectId, userId);																				
			}
			

			
		
			
	}

	//방 이름을 가져옴	
	function getRoomName(roomId, userId){

		$.ajax({
			url:"roomName/"+ roomId + "/" + userId,
			type:"get",
			success: (data) => {
				console.log("방이름");
				console.log(data);
				$(".chatName").text(data[0].room_log.room_name);
				readMessage(userId, data[0].room_log.room_objectId);
			},
			error : (status) => {
				console.log(status);
			}
		});
		
	} 
	
	//채팅 화면으로
	function viewChat(div){
		changeView();	
		getMessage(div.id);

		roomId = div.id;
		var roominfo = {
			commend:'join',
			id:div.id
		}
		socket.emit('room',roominfo);
		
		
	}	

	//읽지 않은 메세지 카운트
	function getNreadCount(i,roomId,userId){

		$.ajax({
			 	url:"getNreadCount/" + roomId + "/" + userId,
			 	type:"get",
			 	success:function(data){
					if(data == 0){
						$("#user"+ i).text("");
					}else{
						$("#user"+ i).text(data.length);
					}
			 	},
			 	error:function(status){
			 		console.log(status);
			 	}	
			});
		}

//그룹 채팅방 개설
function usersCreateRoom(){
			//var chatUserName = $("#" + div.id).children(".user_info").children().text().split("(")[0];
			
			var chatName = $("#chatName").val();
			var $input = $("input[type='checkbox']:checked");
			console.log($input);
			if(chatName == ""){
				alert("채팅방 이름을 입력하세요");
				return false;   
			}
			if($input.length < 1){
				alert("채팅방 사용자를 추가하세요");
			}	
				
				var chatUsers = new Array();
				var chatUserName = new Array();
				var chatRoomInfo;
				
				for(var i =0; i<$input.length; i++){
					chatUsers.push($input.eq(i).parent().siblings(':first').children().val());
					chatUserName.push($input.eq(i).parent().siblings(":first").next().text().split("(")[0]);
				}

				chatUsers.push(userId);
				chatUserName.push(userName);
				createRoom(userId,chatUserName,chatUsers,chatName,2);
}


function addChatUser(){


}

function closeRoom(value){

	$('#action_menu_btn').click();

	if(value == '2'){
		window.confirm("방을 나가시면 채팅 내역과 정보가 사라집니다. 그래도 나가시겠습니까?");
		$.ajax({
			url:"deleteRoom",
			type:"post",
			data:{roomId:roomId,userId:userId},
			success:function(data){
				console.log(data);

				
			},
			error:function(status){
				console.log(status);
			},

		});
	}
	closeInfo = {
					commend:'close',
					id:roomId
				}

	socket.emit('room',closeInfo);

	showChatList();
	$(".contacts_card").css("display","inline !important");
	$(".contacts_body").css("display","inline");
	$(".card").slideToggle(400);
}


 function onlineCheck(data) {
 	socket.emit('onlineCheck',data);
 }

socket.on('onlineCheck', function(result){
	console.log(result);
	
	$("#" + result.data).children(':first').children('span').attr('class',result.online);
		

});

function readMessage(userId, roomId){
	$.ajax({
		url:"readMessage",
		type:"post",
		data:{userId:userId, roomId:roomId},
		success: (data) => {
			console.log("로그삭제");
			console.log(data);
		},
		error: (status) => {
			console.log(status);
		}
	});
}

function chatStatus(){
	$('.action_menu').toggle();
	$(".chatStatus").slideToggle();
	$.ajax({
		url:"checkUsers/" + roomId,
		type:"get",
		success: (data) => {
			console.log(data);

			for(var i=0; i<data.length; i++){
				if(data[i].room_log.room_user != userId){
					console.log($("."+ data[i].room_log.room_user));

					$("."+ data[i].room_log.room_user).css({"background":"gray","opacity":"0.5"});

					$("."+ data[i].room_log.room_user).children(":last").children().css("display","none").attr("checked",true);
					//$("."+ data[i].room_log.room_user);
				}
			}	

		},
		error: (status) => {
			console.log(status);
		}
	});
}

function toggleMenu(){
	$('.action_menu').slideToggle();
	$(".chatStatus").toggle();
}
		

function getAddUser(){

	$(".users_info").empty();
	$.ajax({
		url:"/getUser",
		type:"post",
		success:function(data){
		for(var i=0; i<data.length; i++){
			if(userId != data[i][0]){
				$(".users_info").append('<tr class=' + data[i][0]  + '>' + '<td>' + '<input type="hidden" value='+ data[i][0] + '>' + '</td>' +
				'<td>'+ data[i][1] + '(' + data[i][3] + ') ' + '-' + data[i][2] +'</td>' + '<td style="padding-left:35px">' +
					  '<input type="checkbox">' + '</td>' + '</tr>');
			}	
		}	
		chatStatus();			  
		},
		error:function(data){

		}
	});
	
		
}

function addUser(){
	var reName = $("#reName").val();

	console.log(reName);
	var $input = $("input[type='checkbox']:checked");
	var addUser = new Array();

	for(var i =0; i<$input.length; i++){
		if($input.eq(i).css("display") != 'none'){
			var users = $input.eq(i).parent().siblings(':first').children().val();
			addUser.push(users);
		}

	}

	var chatUsers = new Array();
	var chatUserName = new Array();

	for(var i =0; i<$input.length; i++){
		chatUsers.push($input.eq(i).parent().siblings(':first').children().val());
		chatUserName.push($input.eq(i).parent().siblings(":first").next().text().split("(")[0]);
	}
	chatUsers.push(userId);
	chatUserName.push(userName);

	console.log(chatUsers);
	console.log(chatUserName);			
	console.log(roomId);
	console.dir(addUser);
	addUsers = {
					createUserId:userId,
					chatUsers:chatUsers,
					chatUserName:chatUserName,
					roomId:roomId,
					roomName:$(".chatName").text(),
					roomType:'2',
					addUser:addUser
				}


	$.ajax({
		url:"addUser",
		type:"post",
		data:addUsers,
		success:function(data){
			console.log(data);
		},
		error:function(status){
			console.log(status);
		}
	});

	// 			chatUsers.push(userId);
	// 			chatUserName.push(userName);

}		
	
function reqFile(messageInfo){
	var fileName = messageInfo.file_items[0].origin_name
	var lastDot = fileName.lastIndexOf('.');
	var ext = fileName.substring(Number(lastDot) + 1,fileName.length).toLowerCase();

	if(ext == 'png' || ext == 'jpg' || ext == 'jpeg'){
		$(".msg_card_body").append('<div class="d-flex justify-content-end mb-4">' +
		'<div class="msg_cotainer_send">' +
		'<img src='+ messageInfo.file_items[0].file_path + ' style="width:200px; height:100px;" onclick="detailImg(this)">'
		+ '<span class="msg_time_send">' + makeDate(messageInfo.message_at) + '</span>' +
		'</div>' +
		'</div>');
	}else{
		$(".msg_card_body").append('<div class="d-flex justify-content-end mb-4">' +
		'<div class="msg_cotainer_send" style="background:white">' +
		'<a>' + messageInfo.file_items[0].origin_name + '</a><br>' + 
		'<a style="font-size:8px">파일크기 : ' + messageInfo.file_items[0].size/1024 + ' Kbytes</a>'
		+ '<br><a href=' + messageInfo.file_items[0].file_path + ' style="font-size:10px; cursor:pointer; color:gray">' + '다운로드' + '</a>'
		+ '<span class="msg_time_send">' + makeDate(messageInfo.message_at) + '</span>' +
		'</div>' +
		'</div>');
	}
	
}

function resFile(messageInfo){
	var fileName = messageInfo.file_items[0].origin_name
	var lastDot = fileName.lastIndexOf('.');
	var ext = fileName.substring(Number(lastDot) + 1,fileName.length).toLowerCase();

	if(ext == 'png' || ext == 'jpg' || ext == 'jpeg'){
		$(".msg_card_body").append('<div class="d-flex justify-content-start mb-4">' + 
										'<span class="img_cont_msg" style="color:white; font-size:12px;">' 
											+ messageInfo.send_userName + 
										'</span>' + 
										'<div class="msg_cotainer">' +
										'<img src='+ messageInfo.file_items[0].file_path + ' style="width:200px; height:100px;" onclick="detailImg(this)">' +  
										 '<span class="msg_time">' + makeDate(messageInfo.message_at) + '</span>' + 
										'</div>' + 
										'</div>');
	}else{
		$(".msg_card_body").append('<div class="d-flex justify-content-end mb-4">' +
		'<div class="msg_cotainer_send" style="background:white">' +
		'<a>' + messageInfo.file_items[0].origin_name + '</a><br>' + 
		'<a style="font-size:8px">파일크기 : ' + messageInfo.file_items[0].size/1024 + ' Kbytes</a>'
		+ '<br><a href='+ messageInfo.file_items[0].file_path +' style="font-size:10px; cursor:pointer; color:gray">' + '다운로드' + '</a>'
		+ '<span class="msg_time_send">' + makeDate(messageInfo.message_at) + '</span>' +
		'</div>' +
		'</div>');
	 }
	
}

function detailImg(img){
	
	$("#pop").fadeIn();
	$("#pop").children('img').attr("src",img.src);
	$("#pop").children('div').children(":first").attr("onclick","location.href='"+img.src + "'").click(function(){
		$("#pop").fadeOut();
	});
}

function datailImgOut(){
	$("#pop").fadeOut();
}