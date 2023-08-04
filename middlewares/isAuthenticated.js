const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const receivedToken = req.headers.authorization.replace("Bearer ", "");
      const foundUser = await User.findOne({ token: receivedToken }).select(
        "account"
      );
      if (foundUser) {
        req.user = foundUser;
        // on crée une clé user dans req.      La route dans laquelle est appelé le middleware pourra avoir accès à req.user
        return next();
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json("Unauthorized");
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
