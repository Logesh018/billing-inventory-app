// seedUser.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/users.js";

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("123456", 10);

    const user = await User.create({
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "SuperAdmin",
      access: ["purchase", "product", "orders"],
    });

    console.log("✅ User created:", user);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createUser();
