var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    Chat = require("./models/chat"),
    User = require("./models/user"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    Message = require("./models/message"),
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

// REMOTE DB
mongoose.connect(process.env.MONGO_URL, {
  auth: {
    user: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD
  },
  useNewUrlParser: true
});


// LOCAL DB
// mongoose.connect("mongodb://localhost/chat", {useNewUrlParser: true});

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


//socket stuff
var http = require("http").createServer(app),
    io = require("socket.io").listen(http);


io.on('connection', function(socket) {
    
    // on connection, move user to room with name equal to chat id
    var chatId = socket.request._query["id"];
    socket.join(chatId);
    
    
   // when a chat message is received from client
   socket.on('im', function (data) {
      
        //create new message document
        var datetime = new Date();
        Message.create({message: data.message, author: mongoose.Types.ObjectId(data.sender), date: datetime}, function(err, message) {
            if(err) {
                console.log(err);
            }
            
            // add message to chat
            Chat.findById(data.room, function(err, chat) {
                if(err) {
                    console.log(err);
                }
                
                // add message
                chat.messages.push(message._id);
                chat.save();
               
                // emit new message to chat
                io.sockets.in(data.room).emit("im", data); 
            });
        });
    });
    
    
    // when a user starts typing
    socket.on("typing", function(data) {
        socket.broadcast.to(data.room).emit("typing", data.username);
    });
    
    // when user stops typing
    socket.on("clear", function(data) {
        socket.broadcast.to(data.room).emit("clear");
    })
});


// import routes
var chatRoutes = require("./routes/chat"),
    authRoutes = require("./routes/auth");
    
app.use(chatRoutes);
app.use(authRoutes);




// run server

http.listen(process.env.PORT, function(err){
    if(err) {
        console.log(err);
    }
    console.log("\nrunning chat server.\n");
});
