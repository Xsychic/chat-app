var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    User = require("./models/user"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    localStrategy = require("passport-local"),
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


// connect to database
// db connection
mongoose.connect("mongodb://localhost/chat", {useNewUrlParser: true});
// mongoose options to remove deprecation warnings
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false)


// Express Session
app.use(session({
  secret: 'OdrcIwfu1R7wKK7Ex5zd',
  saveUninitialized: true,
  resave: true
}));


// configure passport
app.use(passport.initialize());
app.use(passport.session())


// local verification strategy
passport.use(new localStrategy(User.authenticate({failureRedirect: "/login", successRedirect: "/", failureFlash: false})));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// import routes
var chatRoutes = require("./routes/chat"),
    authRoutes = require("./routes/auth");
    
app.use(chatRoutes);
app.use(authRoutes);




// run server

app.listen(process.env.PORT, process.env.IP, function(err){
    if(err) {
        console.log(err);
    }
    console.log("\nrunning chat server.\n");
});
