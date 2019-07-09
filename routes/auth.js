// init
var express = require("express"),
    passport = require("passport"),
    mongoose = require("mongoose"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    router = express.Router();


// routes


// get login form route
router.get("/login", function(req, res) {
    res.render("auth/login");
});


// post login form route
router.post("/login", passport.authenticate("local", {failureRedirect: "/login", failureFlash: false}), function(req, res) {
    res.redirect("/");
});


// get register form route
router.get("/register", function(req, res) {
    res.render("auth/register");
});


// post register form route
router.post("/register", function(req, res) {
    // create new user object
    var newUser = new User({
        username: req.body.username
    });
    
    // add new user to database
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
        }
        console.log(user);
        // log new user in
        passport.authenticate("local")(req, res, function() {
            res.redirect("/");   
        });
    });
});


// logout route
router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/login");
});


// catch all 404 route
router.get("*", function(req, res) {
    res.render("auth/404");
});







// export routes
module.exports = router;