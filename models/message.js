// User Schema

var mongoose = require("mongoose");

    
var MessageSchema = new mongoose.Schema({
    message: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    recipient: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    date: Date
});


module.exports = mongoose.model("message", MessageSchema);