var express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    app = express();
    


// default view engine (ejs)
app.set("view engine", "ejs");    
// separates part of request into req.body
app.use(bodyParser.urlencoded({extended: true}));
// serves the public folder
app.use(express.static(__dirname + "/public"));
// allows for put, delete routes
app.use(methodOverride("_method"));

// ROUTES
app.get("/login", function(req, res) {
    res.render("auth/login");
});

app.get("/register", function(req, res) {
    res.render("auth/register");
});
    
app.get("/", function(req, res) {
    res.render("chat/index");
});

app.get("*", function(req, res) {
    res.render("auth/404");
});






app.listen(process.env.PORT, process.env.IP, function(err){
    if(err) {
        console.log(err);
    }
    console.log("\nrunning chat server.\n");
});
