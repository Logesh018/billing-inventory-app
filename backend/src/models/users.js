// models/users.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ["SuperAdmin", "Admin", "Employee"],
        message: "Please select SuperAdmin, Admin or Employee",
      },
    },
    access: {
      type: [String], // Array of strings for module access, e.g., ['purchase', 'product', 'orders', 'production', 'invoices', 'buyer']
      default: [],
      validate: {
        validator: function (v) {
          // Optional: Validate against known modules; can expand later
          const validModules = ['purchase', 'product', 'orders', 'production', 'invoices', 'buyer'];
          return v.every((module) => validModules.includes(module));
        },
        message: "Invalid access module provided",
      },
    },
    // Future fields can be added here easily, e.g.,
    // isActive: { type: Boolean, default: true },
    // lastLogin: { type: Date },
    // profileImage: { type: String },
  },
  { timestamps: true }
);



export default mongoose.model("User", UserSchema);