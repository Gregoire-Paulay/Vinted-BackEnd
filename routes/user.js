const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid = require("uid2");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

const User = require("../models/User");
const router = express.Router();

// constante pour convertir mon image et l'envoyer ensuite à cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// 1 - creation d'un utilisateur
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const { username, email, newsletter, password } = req.body;
    // console.log("req.body ==>", req.body);
    const foundUser = await User.findOne({ email: email });

    if (!username || !email || !password) {
      return res
        .status(400)
        .json("Renseignez tout les paramètres pour pouvoir vous inscrire");
    } else {
      if (foundUser === null) {
        const salty = uid(16);
        const userToken = uid(32);
        const saltyPassword = password + salty;
        const hash = SHA256(saltyPassword).toString(encBase64);

        // 1 - Création nouvel utilisateur
        const newUser = new User({
          email: email,
          account: { username: username },
          newsletter: newsletter,
          token: userToken,
          hash: hash,
          salt: salty,
        });

        // 2 - Si je recois une image, upload sur Cloudinary, puis on enregistre le résultat dans la clef avatar de la clef account de l'utilisateur
        if (req.files?.avatar) {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            convertToBase64(req.files.avatar),
            {
              folder: `vinted/users/${newUser._id}`,
              public_id: "avatar",
            }
          );
          newUser.account.avatar = cloudinaryResponse.secure_url;
        }

        // 3 - Sauvgarde de l'utilisateur dans la BDD
        await newUser.save();
        const responseObject = {
          email: email,
          account: { username: username },
        };
        console.log(responseObject);
        return res.status(201).json(responseObject);
      } else {
        return res.status(409).json("Cette adresse mail est déjà enregistré");
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// 2 - route pour se login
router.post("/user/login", async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });
    if (foundUser) {
      const newSaltyPassword = req.body.password + foundUser.salt;
      const newHash = SHA256(newSaltyPassword).toString(encBase64);
      if (newHash === foundUser.hash) {
        const responseObject = {
          _id: foundUser._id,
          token: foundUser.token,
          account: { username: foundUser.account.username },
        };
        return res.status(200).json(responseObject);
      } else {
        return res
          .status(400)
          .json({ message: "l'email ou le mot de passe est incorrecte" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "l'email ou le mot de passe est incorrecte" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
