var mongoose = require("mongoose"),
    Chat = require("../models/chat");

var middlewareObj = {};

middlewareObj.checkUser = function(req, res, next) {
    if(req.user) {
        // if a user is logged in
        next();
    } else {
        // if no user logged in, redirect to login form
        return res.redirect("/login");   
    }
};


middlewareObj.checkParticipation = function(req, res, next) {
    Chat.findById(req.params.chatid).populate("users").exec(function(err, chat) {
        if(err) {
            console.log(err);
        }
        
        var found = false;
        
        chat.users.forEach(function(user) {
            if(req.user._id.equals(user._id)) {
                found = true
            }
        });
        
        if(found === true) {
            next();
        } else {
            return res.redirect("/chat");   
        }
    });
};


// export middleware object
module.exports = middlewareObj;