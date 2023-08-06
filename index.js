require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
mongoose.connect(process.env.MONGODB_URI);

// Route de base du serveur
app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur le serveur Vinted");
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// Import routes user
const UserRoutes = require("./routes/user");
app.use(UserRoutes);

// Import routes offer
const OfferRoutes = require("./routes/offer");
app.use(OfferRoutes);

// Fin du serveur
app.all("*", (req, res) => {
  return res.status(404).json("Cette page n'existe pas: essaye autre chose");
});
app.listen(process.env.PORT, () => {
  console.log("Serveur Vinted online");
});
