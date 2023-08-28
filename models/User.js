const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: { type: String, required: true },
  account: {
    username: {
      required: true,
      type: String,
    },
    avatar: Object,
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
