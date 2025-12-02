// buyerController.js
import Buyer from "../models/buyer.js";

export const createBuyer = async (req, res) => {
  try {
    const { 
      buyerCategory,
      yasBuyerType,
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
      creditLimit,
      remarks,
      isActive,
      contactPerson,
      alternatePhone,
      businessType,
      paymentTerms
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Buyer name is required" });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ message: "Buyer mobile is required" });
    }
    if (!buyerCategory || !["Regular", "YAS"].includes(buyerCategory)) {
      return res.status(400).json({ message: "Valid buyer category is required" });
    }
    if (buyerCategory === "YAS" && !yasBuyerType) {
      return res.status(400).json({ message: "YAS Buyer Type is required for YAS buyers" });
    }

    const buyer = new Buyer({
      // Category
      buyerCategory: buyerCategory || "Regular",
      yasBuyerType: buyerCategory === "YAS" ? yasBuyerType : "",
      
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
      creditLimit: creditLimit || 0,

      // Legacy fields
      contactPerson: contactPerson?.trim() || "",
      alternatePhone: alternatePhone?.trim() || "",
      businessType: businessType?.trim() || "",
      paymentTerms: paymentTerms?.trim() || "",

      // Others
      remarks: remarks?.trim() || "",
      isActive: isActive !== undefined ? isActive : true
    });

    const savedBuyer = await buyer.save();
    res.status(201).json(savedBuyer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Buyer with this code already exists" });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error("Error creating buyer:", error);
    res.status(500).json({ message: "Failed to create buyer" });
  }
};

export const getAllBuyers = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { buyerCategory: category } : {};
    
    const buyers = await Buyer.find(filter).sort({ createdAt: -1 });
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
    const updateData = { ...req.body };
    
    // Trim and format fields if they exist
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.email) updateData.email = updateData.email.trim().toLowerCase();
    if (updateData.alternateEmail) updateData.alternateEmail = updateData.alternateEmail.trim().toLowerCase();
    if (updateData.pocEmail) updateData.pocEmail = updateData.pocEmail.trim().toLowerCase();
    if (updateData.pocContactEmail) updateData.pocContactEmail = updateData.pocContactEmail.trim().toLowerCase();
    if (updateData.gst) updateData.gst = updateData.gst.trim().toUpperCase();
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

    // Validate YAS buyer type requirement
    if (updateData.buyerCategory === "YAS" && !updateData.yasBuyerType) {
      return res.status(400).json({ message: "YAS Buyer Type is required for YAS buyers" });
    }
    if (updateData.buyerCategory === "Regular") {
      updateData.yasBuyerType = "";
    }

    const buyer = await Buyer.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.status(200).json(buyer);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
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