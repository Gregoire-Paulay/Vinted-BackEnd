const express = require("express");
const router = express.Router();

const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
// Import de mon middleware
const isAuthenticated = require("../middlewares/isAuthenticated");

const User = require("../models/User");
const Offer = require("../models/Offer");

// constante pour convertir mon image et l'envoyer ensuite à cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// 1 - Route pour créer des offres
router.post("/offers", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    // console.log("req.user ===>", req.user);

    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { Marque: brand },
        { Taille: size },
        { État: condition },
        { Couleur: color },
        { Emplacement: city },
      ],
      owner: req.user,
    });
    console.log(newOffer);

    const convertedFile = convertToBase64(req.files.picture);
    const cloudinaryResponse = await cloudinary.uploader.upload(convertedFile, {
      folder: `vinted/offer/${newOffer._id}`,
      public_id: req.user.account.username,
    });
    newOffer.product_image = cloudinaryResponse;

    await newOffer.save();
    return res.status(201).json(newOffer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// 2 - Route pour modifier une offre
router.put("/offers/:id", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const foundOffer = await Offer.findById(req.params.id).populate("owner");
    // console.log("Mon offre a modifié ==> ", foundOffer);

    if (foundOffer.owner.account.username === req.user.account.username) {
      console.log(req.body);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // on va  chercher les nouvelles infos pour les remplacer

      foundOffer.product_name = title;
      foundOffer.product_description = description;
      foundOffer.product_price = price;
      foundOffer.product_details[0] = { Marque: brand };
      foundOffer.product_details[1] = { Taille: size };
      foundOffer.product_details[2] = { État: condition };
      foundOffer.product_details[3] = { Couleur: color };
      foundOffer.product_details[4] = { Emplacement: city };

      const convertedFile = convertToBase64(req.files.picture);
      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertedFile,
        {
          folder: `vinted/offer/${foundOffer._id}`,
          public_id: req.user.account.username,
        }
      );
      foundOffer.product_image = cloudinaryResponse.secure_url;

      // console.log("Mon offre modifié ==>", foundOffer);
      await foundOffer.save();
      return res.status(202).json(foundOffer);
    } else {
      return res.status(400).json({ message: "Offer not found" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// 3 - Route pour supprimez une offre
router.delete("/offers/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const foundOffer = await Offer.findById(req.params.id).populate("owner");

      if (foundOffer.owner.account.username === req.user.account.username) {
        // console.log(foundOffer);
        await Offer.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Removed Offer" });
      } else {
        return res.status(400).json({ message: "Unauthorized" });
      }
    } else {
      return res.status(400).json({ message: "Missing id" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 4 - Route pour lire les annonces avec des filtres
router.get("/offers", async (req, res) => {
  try {
    const { priceMin, title, page, priceMax, sort } = req.query;

    // filtre de prix et de nom
    let filters = {};

    if (priceMin && priceMax) {
      filters.product_price = { $gte: priceMin, $lte: priceMax };
    } else if (priceMin) {
      filters.product_price = { $gte: priceMin };
    } else if (priceMax) {
      filters.product_price = { $lte: priceMax };
    }
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    // Tri croissant ou décroissant
    const sortOffer = {};
    if (sort) {
      sortOffer.product_price = sort.slice(6);
    }

    // On défini par défaut une limit à 20 offres par pages
    const limit = 20;
    const skip = (page - 1) * limit;

    const offers = await Offer.find(filters)
      .select("product_name product_price -_id")
      .sort(sortOffer)
      .limit(limit)
      .skip(skip);
    console.log(offers);
    return res.status(200).json(offers);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
