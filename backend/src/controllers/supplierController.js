import Supplier from "../models/supplier.js";

export const createSupplier = async (req, res) => {
  try {
    const { name, code, mobile, gst, email, address, vendorGoods } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Supplier name is required" });
    }
    if (!mobile?.trim()) {
      return res.status(400).json({ message: "Supplier mobile is required" });
    }

    // ✅ Validate vendor goods
    if (!vendorGoods || !vendorGoods.category) {
      return res.status(400).json({ message: "Please specify supplier category (Fabrics or Accessories)" });
    }

    if (vendorGoods.category === "Accessories" && !vendorGoods.details?.trim()) {
      return res.status(400).json({ message: "Please specify accessory details (e.g. buttons, packets)" });
    }

    const supplier = new Supplier({
      name: name.trim(),
      code: code || undefined,
      mobile: mobile.trim(),
      gst: gst?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      address: address?.trim() || "",
      vendorGoods: {
        category: vendorGoods.category,
        details: vendorGoods.details || null
      }
    });

    const savedSupplier = await supplier.save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Supplier with this code already exists" });
    }
    console.error("Error creating supplier:", error);
    res.status(500).json({ message: "Failed to create supplier" });
  }
};

export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.status(200).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.status(200).json({ message: "Supplier removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};