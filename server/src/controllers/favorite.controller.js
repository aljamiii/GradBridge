// CONTROLLER: favorites — the full CRUD set for saved universities.
// Every operation is scoped to req.user so students only touch their own list.
import Favorite from "../models/Favorite.js";

// CREATE — POST /api/favorites
export const addFavorite = async (req, res, next) => {
  try {
    const { name, country, stateProvince, website, domain, notes } = req.body;

    const favorite = await Favorite.create({
      user: req.user._id,
      name, country, stateProvince, website, domain,
      notes: notes || "",
    });

    res.status(201).json({ success: true, favorite });
  } catch (err) {
    if (err.code === 11000) {
      // the unique index fired — already saved
      return res
        .status(400)
        .json({ success: false, message: "You already saved this university." });
    }
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstMessage });
    }
    next(err);
  }
};

// READ — GET /api/favorites
export const listFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: favorites.length, favorites });
  } catch (err) {
    next(err);
  }
};

// UPDATE — PUT /api/favorites/:id  (edit your notes)
export const updateFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // scoped: can't touch others' favorites
      { notes: req.body.notes ?? "" },
      { new: true, runValidators: true } // return the updated doc
    );
    if (!favorite) {
      return res.status(404).json({ success: false, message: "Favorite not found." });
    }
    res.json({ success: true, favorite });
  } catch (err) {
    next(err);
  }
};

// DELETE — DELETE /api/favorites/:id
export const removeFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!favorite) {
      return res.status(404).json({ success: false, message: "Favorite not found." });
    }
    res.json({ success: true, message: `Removed ${favorite.name}.` });
  } catch (err) {
    next(err);
  }
};
