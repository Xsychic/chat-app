// User Schema

var mongoose = require("mongoose"),
    uniqueValidator = require("mongoose-unique-validator"),
    passportLocalMongoose = require("passport-local-mongoose");
    
var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true},
    contacts: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    password: String
});

UserSchema.plugin(uniqueValidator, "A user is already registered with that {PATH}.");
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);