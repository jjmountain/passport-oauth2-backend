const mongoose = require("mongoose");

const user = new mongoose.Schema({
  googleId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", user);
