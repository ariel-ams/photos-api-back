const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const db = require("./config/config").get(process.env.NODE_ENV);
const User = require("./models/user");
const { auth } = require("./middlewares/auth");
const paginate = require("paginate-array");
const { default: axios } = require("axios");
const cors = require("cors");

const app = express();

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());

//database connection
mongoose.Promise = global.Promise;
mongoose.connect(
  db.DATABASE,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (error) {
    if (error) console.error(error);
    console.log("database is connected");
  }
);

var corsOptions = {
  origin: 'http://localhost:8080',
  optionsSuccessStatus: 200 // For legacy browser support
}

app.use(cors(corsOptions));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.get("/", function (request, response) {
  response.status(200).send("Welcome to login, sign-up api");
});

app.post("/api/register", function (request, response) {
  const newUser = new User(request.body);

  if (newUser.password != newUser.password2)
    return response.status(400).json({ message: "password does not match" });

  User.findOne({ email: newUser.email }, function (error, user) {
    if (user)
      return response
        .status(400)
        .json({ auth: false, message: "email already exists" });

    newUser.save((error, doc) => {
      if (error) {
        console.error(error);
        return response.status(400).json({ success: false });
      }

      response.status(200).json({
        success: true,
        user: doc._id,
      });
    });
  });
});

app.post("/api/login", function (request, response) {
  let token = request.cookies.auth;
  User.findByToken(token, (err, user) => {
    if (err) return response(err);

    if (user) {
      return response.status(400).json({
        error: true,
        message: "You are already logged in",
      });
    } else {
      User.findOne({ email: request.body.email }, function (err, user) {
        if (!user)
          return response.json({
            isAuth: false,
            message: " Auth failed, email not found",
          });

        user.comparePassword(request.body.password, (err, isMatch) => {
          if (!isMatch)
            return response.json({
              isAuth: false,
              message: "password does not match",
            });

          user.generateToken((err, _user) => {
            if (err) return response.status(400).send(err);

            response.cookie("auth", _user.token).json({
              isAuth: true,
              id: _user._id,
              email: _user.email,
              token: _user.token
            });
          });
        });
      });
    }
  });
});

app.get("/api/logout", auth, function (request, response) {
  request.user.deleteToken(request.token, (err, user) => {
    if (err) return response.status(400).send(err);

    response.sendStatus(200);
  });
});

app.get("/api/photos", auth, function(request, response) {
    axios.get('https://jsonplaceholder.typicode.com/photos')
        .then(_response => {
            const results = paginate(_response.data, request.query.page, 10);
            
            response.json({
                object: 'list',
                data: results
            });
        })
        .catch(error => {
            response.json({
                error: error
            });
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app is live at ${PORT}`);
});