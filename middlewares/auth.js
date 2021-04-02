const User = require('../models/user');

let auth = (request, response, next) => {
    let token = request.cookies.auth;
    User.findByToken(token, (error, user) => {
        if(error) throw error;
        if(!user) return response.json({error: 'Auth error'});

        request.token = token;
        request.user = user;
        next();
    });
}

module.exports = {auth};