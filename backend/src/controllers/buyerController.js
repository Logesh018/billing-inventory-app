// buyerController.js
import Buyer from "../models/buyer.js";

export const createBuyer = async (req, res) => {
  try {
    const { name, code, mobile, gst, email, address } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Buyer name is required" });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ message: "Buyer mobile is required" });
    }

    const buyer = new Buyer({
      name: name.trim(),
      code: code || undefined, // Let pre-save middleware generate code if not provided
      mobile: mobile.trim(),
      gst: gst ? gst.trim() : "",
      email: email ? email.trim().toLowerCase() : "",
      address: address ? address.trim() : "",
    });

    const savedBuyer = await buyer.save();
    res.status(201).json(savedBuyer);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (e.g., unique code)
      return res.status(400).json({ message: "Buyer with this code already exists" });
    }
    console.error("Error creating buyer:", error);
    res.status(500).json({ message: "Failed to create buyer" });
  }
};

// Rest of the controller functions remain unchanged
export const getAllBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find().sort({ createdAt: -1 });
    res.status(200).json(buyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBuyerById = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.status(200).json(buyer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.status(200).json(buyer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndDelete(req.params.id);
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.status(200).json({ message: "Buyer removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};