const User = require("../models/user");
const { default: axios } = require("axios");
const paginate = require("paginate-array");

module.exports = {
  login: function (request, response) {
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
                token: _user.token,
              });
            });
          });
        });
      }
    });
  },
  logout: function (request, response) {
    request.user.deleteToken(request.token, (err) => {
      if (err) return response.status(400).send(err);

      response.sendStatus(200);
    });
  },
  register: function (request, response) {
    const newUser = new User(request.body);

    if(!newUser.email)
        return response.status(400).json({ message: "email is required" });

    if(!newUser.password)
        return response.status(400).json({ message: "password is required" });

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
  },
  photos: function (request, response) {
    axios
      .get("https://jsonplaceholder.typicode.com/photos")
      .then((_response) => {
        const results = paginate(_response.data, request.query.page, 10);

        response.json({
          object: "list",
          data: results,
        });
      })
      .catch((error) => {
        response.json({
          error: error,
        });
      });
  },
};
