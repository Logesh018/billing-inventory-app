import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./src/lib/db.js";
import path from "path";
import { fileURLToPath } from 'url';

// ✅ Correct __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import purchaseRoutes from "./src/routes/purchaseRoutes.js";
import productionRoutes from "./src/routes/productionRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import buyerRoutes from "./src/routes/buyerRoutes.js";
import fabricRoutes from "./src/routes/fabricRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import { invoiceRouter } from "./src/routes/invoiceRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/productions", productionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/fabrics", fabricRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/invoices", invoiceRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/*splat", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await connectDB();
});