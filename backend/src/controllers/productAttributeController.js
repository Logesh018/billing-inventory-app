import ProductAttribute from "../models/productAttribute.js";

/**
 * Get all attributes by type
 * GET /api/product-attributes?type=category
 * GET /api/product-attributes?type=fabric
 */
export const getAttributesByType = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ 
        message: "Attribute type is required",
        validTypes: ["category", "list", "type", "style", "fabric"]
      });
    }

    const validTypes = ["category", "list", "type", "style", "fabric"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: "Invalid attribute type",
        validTypes
      });
    }

    const attributes = await ProductAttribute.getValuesByType(type);
    
    console.log(`✅ Fetched ${attributes.length} ${type} attributes`);
    
    res.status(200).json(attributes);
  } catch (error) {
    console.error("❌ Error in getAttributesByType:", error);
    res.status(500).json({
      message: "Error fetching attributes",
      error: error.message
    });
  }
};

/**
 * Search attributes by type and search term
 * GET /api/product-attributes/search?type=fabric&q=air
 */
export const searchAttributes = async (req, res) => {
  try {
    const { type, q } = req.query;

    if (!type || !q) {
      return res.status(400).json({ 
        message: "Both 'type' and 'q' (search query) are required" 
      });
    }

    if (q.length < 1) {
      return res.status(200).json([]);
    }

    const attributes = await ProductAttribute.searchByTypeAndTerm(type, q);
    
    console.log(`🔍 Found ${attributes.length} ${type} attributes matching "${q}"`);
    
    res.status(200).json(attributes);
  } catch (error) {
    console.error("❌ Error in searchAttributes:", error);
    res.status(500).json({
      message: "Error searching attributes",
      error: error.message
    });
  }
};

/**
 * Add a new attribute value
 * POST /api/product-attributes
 * Body: { attributeType: "fabric", value: "Airtex" }
 */
export const addAttribute = async (req, res) => {
  try {
    const { attributeType, value } = req.body;

    if (!attributeType || !value) {
      return res.status(400).json({ 
        message: "Both 'attributeType' and 'value' are required" 
      });
    }

    const validTypes = ["category", "list", "type", "style", "fabric"];
    if (!validTypes.includes(attributeType)) {
      return res.status(400).json({ 
        message: "Invalid attribute type",
        validTypes
      });
    }

    // Trim and validate value
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return res.status(400).json({ 
        message: "Value cannot be empty" 
      });
    }

    // Check if value is "Others" - we don't want to save this
    if (trimmedValue.toLowerCase() === "others") {
      return res.status(400).json({ 
        message: "'Others' is a reserved value and cannot be added" 
      });
    }

    // Add or get existing attribute
    const attribute = await ProductAttribute.addOrGetAttribute(
      attributeType, 
      trimmedValue, 
      "user"
    );

    console.log(`✅ Added/Retrieved ${attributeType}: ${attribute.value}`);
    
    res.status(201).json({
      message: "Attribute added successfully",
      attribute
    });
  } catch (error) {
    console.error("❌ Error in addAttribute:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This attribute value already exists",
        error: error.message
      });
    }
    
    res.status(500).json({
      message: "Error adding attribute",
      error: error.message
    });
  }
};

/**
 * Update an attribute (mainly for deactivating)
 * PUT /api/product-attributes/:id
 * Body: { isActive: false }
 */
export const updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, value } = req.body;

    const attribute = await ProductAttribute.findById(id);
    if (!attribute) {
      return res.status(404).json({ message: "Attribute not found" });
    }

    // Update fields
    if (typeof isActive === "boolean") {
      attribute.isActive = isActive;
    }

    if (value && value.trim()) {
      // Check if new value already exists
      const existing = await ProductAttribute.findOne({
        attributeType: attribute.attributeType,
        value: { $regex: new RegExp(`^${value.trim()}$`, 'i') },
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(409).json({
          message: "An attribute with this value already exists"
        });
      }

      attribute.value = value.trim();
    }

    await attribute.save();

    console.log(`✅ Updated attribute: ${attribute.value}`);
    
    res.status(200).json({
      message: "Attribute updated successfully",
      attribute
    });
  } catch (error) {
    console.error("❌ Error in updateAttribute:", error);
    res.status(500).json({
      message: "Error updating attribute",
      error: error.message
    });
  }
};

/**
 * Delete an attribute (hard delete - use with caution)
 * DELETE /api/product-attributes/:id
 */
export const deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;

    const attribute = await ProductAttribute.findById(id);
    if (!attribute) {
      return res.status(404).json({ message: "Attribute not found" });
    }

    // Check if it's a system attribute
    if (attribute.source === "system") {
      return res.status(403).json({ 
        message: "Cannot delete system-defined attributes. Use deactivate instead." 
      });
    }

    // Check if it's being used (optional - you can add this check later)
    if (attribute.usageCount > 0) {
      return res.status(403).json({ 
        message: `This attribute is being used in ${attribute.usageCount} products. Deactivate instead of deleting.` 
      });
    }

    await ProductAttribute.findByIdAndDelete(id);

    console.log(`🗑️  Deleted attribute: ${attribute.value}`);
    
    res.status(200).json({
      message: "Attribute deleted successfully",
      deletedAttribute: attribute
    });
  } catch (error) {
    console.error("❌ Error in deleteAttribute:", error);
    res.status(500).json({
      message: "Error deleting attribute",
      error: error.message
    });
  }
};

/**
 * Increment usage count for an attribute
 * POST /api/product-attributes/:id/increment-usage
 */
export const incrementAttributeUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const attribute = await ProductAttribute.findById(id);
    if (!attribute) {
      return res.status(404).json({ message: "Attribute not found" });
    }

    await attribute.incrementUsage();

    res.status(200).json({
      message: "Usage count updated",
      attribute
    });
  } catch (error) {
    console.error("❌ Error in incrementAttributeUsage:", error);
    res.status(500).json({
      message: "Error updating usage count",
      error: error.message
    });
  }
};

/**
 * Get all attribute types with their counts
 * GET /api/product-attributes/summary
 */
export const getAttributesSummary = async (req, res) => {
  try {
    const types = ["category", "list", "type", "style", "fabric"];
    const summary = {};

    for (const type of types) {
      const count = await ProductAttribute.countDocuments({ 
        attributeType: type, 
        isActive: true 
      });
      summary[type] = count;
    }

    console.log("📊 Attributes summary:", summary);
    
    res.status(200).json(summary);
  } catch (error) {
    console.error("❌ Error in getAttributesSummary:", error);
    res.status(500).json({
      message: "Error fetching summary",
      error: error.message
    });
  }
};