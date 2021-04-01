var mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config').get(process.env.NODE_ENV);
const salt = 10;

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: 1
    },
    password:{
        type: String,
        required: true,
        minlenght: 8
    },
    password2:{
        type: String,
        required: true,
        minlenght: 8
    },
    token:{
        type:String
    }
});

userSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')){
        bcrypt.genSalt(salt, function(error, salt){
            if(error) return next(error);

            bcrypt.hash(user.password, salt, function(error, hash){
                if(error) return next(error);
                user.password = hash;
                user.password2 = hash;
                next();                
            })
        });
    } else {
        next();
    }
});

userSchema.methods.comparePassword = function(password, cb){
    bcrypt.compare(password, this.password, function(error, isMatch){
        if(error) return cb(error);
        cb(null, isMatch);
    });
}

userSchema.methods.generateToken = function(cb){
    let user = this;
    var token = jwt.sign(user._id.toHexString(), config.SECRET);

    user.token = token;
    user.save(function(error, _user){
        if(error) return cb(error);
        cb(null, _user);
    });
}

userSchema.statics.findByToken = function(token, cb){
    let user = this;

    jwt.verify(token, config.SECRET, function(err, decode){
        user.findOne({"_id": decode, "token": token}, function(error, _user){
            if(error) return cb(error);
            cb(null, _user);
        });
    });
}

userSchema.methods.deleteToken = function(token, cb){
    let user = this;

    user.update({$unset: {token: 1}}, function(error, _user){
        if(error) return cb(error);

        cb(null, _user);
    })
}

module.exports = mongoose.model('User', userSchema);