import express from "express";
import { authorisedOnly } from "../middleware/auth";
const router = express.Router();


router.get("/", authorisedOnly, (req, res) => {
  res.json({ 
    message: "success", 
    user: req.user || "non" 
  });
});

export default router;
