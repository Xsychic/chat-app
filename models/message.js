// User Schema

var mongoose = require("mongoose");

    
var MessageSchema = new mongoose.Schema({
    message: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    date: Date,
    announcement: {type: Boolean, default: false}
});


module.exports = mongoose.model("Message", MessageSchema);