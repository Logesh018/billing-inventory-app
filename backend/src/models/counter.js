// models/counter.js
import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // e.g., "orderSeq_FOB", "purchaseSeq"
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema);