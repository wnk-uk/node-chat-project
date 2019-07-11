const mongoose = require('mongoose');	

const roomSchema = mongoose.Schema({
        // id:{type:String},
        // name:{type:String},
        // dept_code:{type:String},
        // job_code:{type:String},
        // profile_img:{type:String}
 
        //room 컬렉션      
        room:{
            roomName:[{type:String}],
            creatUserId:{type:String},
            chatUser:[{type:String}],  
            chats_img:{type:String},
            room_type:{type:String}
        },
             
        message:{
            roomId:{type:String},
            content:{type:String},
            message_at:{type:String},
            send_user:{type:String},
            send_userName:{type:String},
            file_items:[{
                           file_path:{type:String},
                           origin_name:{type:String},
                           size:{type:Number}
                       }]
           },

        room_log:{
            room_objectId:{type:String},
            user_log:{type:String},
            room_user:{type:String},
            room_name:{type:String},
            end_message:{type:String}    
        },
        
        message_log:{
            roomId:{type:String},
            receiper:{type:String}
        }
    });

module.exports = mongoose.model('Room',roomSchema); 