var middlewareObj = {};

middlewareObj.checkUser = function(req, res, next) {
    if(req.user) {
        // if a user is logged in
        next();
    } else {
        // if no user logged in, redirect to login form
        return res.redirect("/login");   
    }
};


// export middleware object
module.exports = middlewareObj