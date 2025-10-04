// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/users.js";

// @desc    Protect routes (Check if user is authenticated)
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      req.user = await User.findById(decoded.id).select("-password");
      console.log("Authenticated user:", req.user); // Add this
      if (!req.user) return res.status(401).json({ message: "Not authorized, user not found" });
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, invalid token" });
    }
  }
  if (!token) res.status(401).json({ message: "Not authorized, no token" });
};

// @desc    Authorize roles or module access
export const authorize = (...required) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user not available" });
    }

    // required can be a role (e.g., 'SuperAdmin') or a module (e.g., 'purchase')
    const hasRole = required.some((r) => r === req.user.role);
    const hasAccess = required.some((r) => req.user.access.includes(r));

    // SuperAdmin has all access
    if (req.user.role === "SuperAdmin") {
      return next();
    }

    // Check if user has the required role or module access
    if (!hasRole && !hasAccess) {
      return res.status(403).json({
        message: `Not authorized to access this resource. Required: ${required.join(", ")}`,
      });
    }

    next();
  };
};