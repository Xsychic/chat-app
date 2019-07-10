// init
var express = require("express"),
    passport = require("passport"),
    mongoose = require("mongoose"),
    Chat = require("../models/chat"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    router = express.Router();
    


// routes

// get chat list route
router.get("/chat", middleware.checkUser, function(req, res) {
    Chat.find({'users':{$in:[req.user._id]}}).populate("users").exec(function(err, chats) {
        if(err) {
            console.log(err);
        }

        // remove self from users
        for(var i = 0; i < chats.length; i++) {
            for(var x = 0; x < chats[i].users.length; x++) {
                if(chats[i].users[x]._id.equals(req.user._id)) {
                    chats[i].users.splice(x,1);
                }
            }
        }
        
        res.render("chat/index", {chats: chats});    
    });
});


// get chat page route
router.get("/chat/:chatid", middleware.checkUser, function(req, res) {
    Chat.find({'users':{$in:[req.user._id]}}).populate("users").exec(function(err, chats) {
        if(err) {
            console.log(err);
        }
        
        // remove self from users
        for(var i = 0; i < chats.length; i++) {
            for(var x = 0; x < chats[i].users.length; x++) {
                if(chats[i].users[x]._id.equals(req.user._id)) {
                    chats[i].users.splice(x,1);
                }
            }
        }
        
        // get chat from url
        Chat.findById(req.params.chatid).populate("users").populate("messages").exec(function(err, chat) {
            if(err) {
                console.log(err);
            }
            
            // remove self from users
            for(var x = 0; x < chat.users.length; x++) {
                if(chat.users[x]._id.equals(req.user._id)) {
                    chat.users.splice(x,1);
                }
            }
            
            // render chat page
            res.render("chat/active", {chats: chats, chat: chat, chatId: req.params.chatid, user: req.user}); 
        });
    });
});


// submit chat form route
router.post("/chat", middleware.checkUser, function(req, res) {
    
});






// export routes
module.exports = router;