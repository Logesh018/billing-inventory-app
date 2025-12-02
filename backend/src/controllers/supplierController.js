import Supplier from "../models/supplier.js";

export const createSupplier = async (req, res) => {
  try {
    const { 
      name, 
      code, 
      company,
      companyType,
      industryType,
      industrySector,
      mobile, 
      alternateMobile,
      landline,
      gst, 
      email, 
      alternateEmail,
      website,
      doorNoStreet,
      city,
      state,
      pincode,
      country,
      address,
      pocName,
      pocEmail,
      pocContactEmail,
      pocDesignation,
      paymentType,
      totalRequirements,
      vendorGoods,
      remarks,
      isActive
    } = req.body;

    // Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({ message: "Supplier name is required" });
    }
    if (!mobile?.trim()) {
      return res.status(400).json({ message: "Supplier mobile is required" });
    }

    // Validate vendor goods
    if (!vendorGoods || !vendorGoods.category) {
      return res.status(400).json({ message: "Please specify supplier category (Fabrics or Accessories)" });
    }

    if (vendorGoods.category === "Accessories" && !vendorGoods.accessoryName?.trim()) {
      return res.status(400).json({ message: "Please specify accessory name (e.g. buttons, zippers)" });
    }

    const supplier = new Supplier({
      // Basic Information
      name: name.trim(),
      code: code || undefined,
      company: company?.trim() || "",
      companyType: companyType || "",
      industryType: industryType?.trim() || "",
      industrySector: industrySector?.trim() || "",
      gst: gst?.trim() || "",

      // Contact Information
      mobile: mobile.trim(),
      alternateMobile: alternateMobile?.trim() || "",
      landline: landline?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      alternateEmail: alternateEmail?.trim().toLowerCase() || "",
      website: website?.trim() || "",

      // Address Details
      doorNoStreet: doorNoStreet?.trim() || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      pincode: pincode?.trim() || "",
      country: country?.trim() || "India",
      address: address?.trim() || "",

      // Point of Contact
      pocName: pocName?.trim() || "",
      pocEmail: pocEmail?.trim().toLowerCase() || "",
      pocContactEmail: pocContactEmail?.trim().toLowerCase() || "",
      pocDesignation: pocDesignation?.trim() || "",

      // Business Details
      paymentType: paymentType || "",
      totalRequirements: totalRequirements || 0,

      // Vendor Goods
      vendorGoods: {
        category: vendorGoods.category,
        accessoryName: vendorGoods.accessoryName?.trim() || ""
      },

      // Others
      remarks: remarks?.trim() || "",
      isActive: isActive !== undefined ? isActive : true
    });

    const savedSupplier = await supplier.save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Supplier with this code already exists" });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
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
    const updateData = { ...req.body };
    
    // Trim and format fields if they exist
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.email) updateData.email = updateData.email.trim().toLowerCase();
    if (updateData.alternateEmail) updateData.alternateEmail = updateData.alternateEmail.trim().toLowerCase();
    if (updateData.pocEmail) updateData.pocEmail = updateData.pocEmail.trim().toLowerCase();
    if (updateData.pocContactEmail) updateData.pocContactEmail = updateData.pocContactEmail.trim().toLowerCase();
    if (updateData.gst) updateData.gst = updateData.gst.trim().toUpperCase();
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

    // Handle vendor goods properly
    if (updateData.vendorGoods) {
      if (updateData.vendorGoods.accessoryName) {
        updateData.vendorGoods.accessoryName = updateData.vendorGoods.accessoryName.trim();
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.status(200).json(supplier);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
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