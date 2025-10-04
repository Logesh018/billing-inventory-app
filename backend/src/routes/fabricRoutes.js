import express from "express";
import FabricMaster from "../models/fabricMaster.js";

const router = express.Router();

// GET all fabrics
router.get("/", async (req, res) => {
  try {
    const fabrics = await FabricMaster.find();
    res.json(fabrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new fabric (only if not exists)
router.post("/", async (req, res) => {
  try {
    const { fabricType, fabricColors, fabricStyles, gsm } = req.body;

    let fabric = await FabricMaster.findOne({ fabricType });

    if (fabric) {
      // If fabricType already exists, just return it
      return res.json(fabric);
    }

    // Otherwise create new
    fabric = new FabricMaster({
      fabricType,
      fabricColors: fabricColors || [],
      fabricStyles: fabricStyles || [],
      gsm: gsm || []
    });

    const saved = await fabric.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
