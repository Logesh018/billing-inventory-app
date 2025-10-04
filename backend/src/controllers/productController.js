import Product from "../models/products.js"; // Use exact file name (e.g., Product.js or products.js)

// @desc    Create a new product
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
    console.log(savedProduct)
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add this function to productController.js
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const products = await Product.searchByName(q);
    console.log(`Found ${products.length} products for query: "${q}"`);

    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error in searchProducts:", error.message);
    res.status(500).json({
      message: "Error searching products",
      error: error.message
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.purchases.length > 0) {
      return res.status(400).json({ message: "Cannot delete product with associated purchases" });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};