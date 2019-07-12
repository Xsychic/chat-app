// User Schema

var mongoose = require("mongoose");

    
var ChatSchema = new mongoose.Schema({
    users: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: "Message"}],
    lastMessage: Date,
    title: String,
    lastAuthor: String
});


module.exports = mongoose.model("chat", ChatSchema);