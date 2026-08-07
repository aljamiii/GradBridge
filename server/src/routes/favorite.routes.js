// ROUTES: favorites CRUD — a student-only feature.
import { Router } from "express";
import {
  addFavorite,
  listFavorites,
  updateFavorite,
  removeFavorite,
} from "../controllers/favorite.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student")); // applies to every route below

router.post("/", addFavorite);        // CREATE
router.get("/", listFavorites);       // READ
router.put("/:id", updateFavorite);   // UPDATE (notes)
router.delete("/:id", removeFavorite); // DELETE

export default router;
