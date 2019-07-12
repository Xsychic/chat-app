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
app.use(bodyParser.json());
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
        Message.create({message: data.message, author: mongoose.Types.ObjectId(data.sender.id), date: datetime}, function(err, message) {
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
                chat.lastMessage = new Date();
                chat.save();
               
               data.user = data.sender.username;
               
                // emit new message to chat
                io.sockets.in(data.room).emit("im", data); 
                
                // update users index page
                data.users.forEach(function(user) {
                    io.sockets.in(String(user._id)).emit("updateIm", {message: data.message, user: data.sender.username, room: data.room});
                });
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
    });
    
    // when a user enters a new group name
    socket.on("title", function(data) {
        Chat.findById(data.room, function(err, chat) {
            if(err) {
                console.log(err);
            }
            
            chat.title = data.title;
            
            if(chat.title == "") {
                var newMessage = data.username + " removed the chat name.";
            } else {
                var newMessage = data.username + " changed the chat name to " + data.title + ".";
            }
            
            Message.create({message: newMessage, announcement: true, date: new Date()}, function(err, message) {
                if(err) {
                    console.log(err);
                }
                
                // add announcement to chat
                chat.messages.push(message._id);
                chat.lastMessage = new Date();
                chat.lastAuthor = undefined;
                chat.save();

                // change title and send message to room
                io.sockets.in(data.room).emit("title", {room: data.room, username: data.username, title: data.title, message: message.message, users: data.users});
            
                // update title on users index page
                data.users.forEach(function(user) {
                    io.sockets.in(String(user._id)).emit("updateTitle", {message: message.message, user: user, room: data.room, title: data.title, users: data.users});
                });
            });
        });
    });
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
