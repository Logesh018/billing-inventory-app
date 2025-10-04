import mongoose from "mongoose";

const processSchema = new mongoose.Schema(
  {
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
      required: true,
    },
    stage: {
      type: String,
      enum: [
        "Cutting",
        "Stitching",
        "Trimming",
        "QC",
        "Ironing",
        "Packing",
        "Stock",
      ],
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    remarks: String,
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Process", processSchema);
