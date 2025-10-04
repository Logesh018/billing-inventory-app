import FabricMaster from "../models/fabricMaster.js";

export const getFabrics = async (req, res) => {
  try {
    const fabrics = await FabricMaster.find();
    console.log("Fetched fabrics:", fabrics); // Debug log
    if (!fabrics.length) {
      console.warn("No fabrics found in database");
    }
    res.status(200).json(fabrics);
  } catch (err) {
    console.error("Error fetching fabrics:", err.stack); // Full stack trace
    res.status(500).json({ message: "Server error", error: err.message });
  }
};