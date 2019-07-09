// init
var express = require("express"),
    passport = require("passport"),
    mongoose = require("mongoose"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    router = express.Router();


// routes

// get chat page route
router.get("/", middleware.checkUser, function(req, res) {
    res.render("chat/index");
});


// submit chat form route
router.post("/", middleware.checkUser, function(req, res) {
    console.log(req.user._id, req.body.message);
    res.redirect("/");
});





// export routes
module.exports = router;