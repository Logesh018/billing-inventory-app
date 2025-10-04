import mongoose from "mongoose";

const fabricMasterSchema = new mongoose.Schema(
  {
    fabricType: {
      type: String,
      required: true,
      trim: true,
    },
    fabricColors: [
      {
        type: String,
        trim: true,
      },
    ],
    fabricStyles: [
      {
        type: String,
        trim: true,
      },
    ],
    gsm: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);


const FabricMaster = mongoose.model("FabricMaster", fabricMasterSchema);
export default FabricMaster;
