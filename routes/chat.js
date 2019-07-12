// init
var express = require("express"),
    passport = require("passport"),
    mongoose = require("mongoose"),
    Chat = require("../models/chat"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    Message = require("../models/message"),
    router = express.Router();
    


// routes

// get chat list route
router.get("/chat", middleware.checkUser, function(req, res) {
    Chat.find({'users':{$in:[req.user._id]}}).populate("users").populate("messages").sort({lastMessage: -1}).exec(function(err, chats) {
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
        
        // get list of users
        User.find({}, function(err, users) {
            if(err) {
                console.log(err);
            }
            
            // render page
            res.render("chat/index", {chats: chats, users: users, user: req.user}); 
        });
    });
});


// get chat page route
router.get("/chat/:chatid", middleware.checkUser, middleware.checkParticipation, function(req, res) {
    Chat.find({'users':{$in:[req.user._id]}}).populate("users").populate({path:'messages', options: {sort: {date: 1}}}).sort({lastMessage: -1}).exec(function(err, chats) {
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
        Chat.findById(req.params.chatid).populate("users").populate({path:'messages'}).sort({'messages.date': -1}).exec(function(err, chat) {
            if(err) {
                console.log(err);
            }
            
            // remove self from users
            for(var x = 0; x < chat.users.length; x++) {
                if(chat.users[x]._id.equals(req.user._id)) {
                    chat.users.splice(x,1);
                }
            }
            
            User.find({}, function(err, users) {
                if(err) {
                    console.log(err);
                }
                
                // populate message authors
                Message.populate(chat, {
                    path: "messages.author",
                    select: "username",
                    model: User
                }, function(err, thing) {
                    if(err) {
                        console.log(err);
                    }
                    
                    return res.render("chat/active", {chats: chats, chat: chat, chatId: req.params.chatid, user: req.user, users: users});         
                });
            });
        });
    });
});


// submit new chat modal route
router.post("/new", middleware.checkUser, function(req, res) {
    
    // create newChat object
    var newChat = {
        users: []
    };
    
    // add user ids to newChat object
    req.body.users.forEach(function(user) {
        newChat.users.push(mongoose.Types.ObjectId(user.id));
    });
    
    Chat.findOne({"users" : {"$all" : newChat.users}}, function(err, chat) {
        if(err) {
            console.log(err);
        }
        
        if(chat) {
            // chat already exists
            console.log("chat already exists");
            res.send("/chat/" + chat._id);
        } else {
            // create new chat
            Chat.create(newChat, function(err, newChat) {
                if(err) {
                    console.log(err);
                }
                
                res.send("/chat/" + newChat._id);
            });
        }
    });
});


// submit add user modal route
router.post("/add/:chatid", middleware.checkUser, function(req, res) {
        
    // find chat being modified
    Chat.findById(req.params.chatid, function(err, addChat) {
        if(err) {
            console.log(err);
        }
        
        var names = [];
        console.log(req.body);
        // add new user(s) to chat
        for(var i = 0; i < req.body.newUsers.length; i++) {
            addChat.users.push(req.body.newUsers[i].id);
            names.push(req.body.newUsers[i].username);
        }
        console.log(names);
        // save chat
        addChat.save();
        
        // create announcement message
        if(names.length == 1) {
            var message = names[0] + " has joined the group"
        } else {
            var message = names[0] + " and " + String(names.length - 1) + " people have joined the group"; 
        }
        
        Message.create({message: message, date: new Date(), announcement: true}, function(err, message) {
            if(err) {
                console.log(err);
            }
            
            // add message to chat
            addChat.messages.push(message._id);
            addChat.save();
            
            // send redirect link
            return res.send("/chat/" + req.params.chatid);
        });
    });
});





// export routes
module.exports = router;