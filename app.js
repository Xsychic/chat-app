var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    Chat = require("./models/chat"),
    User = require("./models/user"),
    flash = require("connect-flash"),
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
// require("dotenv").config()

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
passport.use(new localStrategy(User.authenticate({failureRedirect: "/login", successRedirect: "/", failureFlash: true})));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// flash message config
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));


// set flash message and user areas in res.locals and reset session removal date
app.use(function(req, res, next) {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    return next();
});



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
                chat.lastAuthor = data.sender.username;
                chat.save();
               
               data.author = data.sender.username;
               data.users.push({"_id": data.sender._id, username: data.sender.username});
               
                // emit new message to chat
                io.sockets.to(data.room).emit("im", data); 
                
                // update users index page
                data.users.forEach(function(user) {
                    io.sockets.to(String(user._id)).emit("updateIm", {message: data.message, author: data.sender.username, room: data.room});
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
                
               data.users.push({"_id": data.sender._id, username: data.sender.username});


                // change title and send message to room
                io.sockets.to(data.room).emit("title", {room: data.room, username: data.username, title: data.title, message: message.message, users: data.users});
                
                // create array with all users for index page
                var indexUsers = data.users;
                indexUsers.push({username: data.username});
                
                // update title on users index page
                data.users.forEach(function(user) {
                    io.sockets.to(String(user._id)).emit("updateTitle", {message: message.message, user: user, room: data.room, title: data.title, users: data.users, indexUsers: indexUsers});
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
