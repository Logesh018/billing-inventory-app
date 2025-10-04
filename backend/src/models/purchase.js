import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
  // Order Reference Fields (minimal from Order)
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  orderDate: { type: Date, required: true },
  PoNo: { type: String },
  orderType: { type: String, enum: ["FOB", "JOB-Works"], required: true },
  buyerCode: { type: String, required: true },
  orderStatus: { type: String, required: true },

  // Products from Order
  products: [
    {
      productName: { type: String, required: true },
      fabricType: { 
        type: String, 
        default: function() {
          return this.parent().orderType === "JOB-Works" ? "N/A" : "";
        }
      },
      fabricColor: { type: String, required: true },
      sizes: [
        {
          size: { type: String, required: true },
          quantity: { type: Number, required: true },
        }
      ],
      productTotalQty: { type: Number, required: true },
    }
  ],
  totalQty: { type: Number, required: true },

  // Purchase Date (can be different from order date)
  purchaseDate: { type: Date, default: Date.now },

  // Purchase-specific fields for Fabrics (only for FOB)
  fabricPurchases: [
    {
      productName: { type: String, required: true },
      fabricType: { type: String, required: true },
      vendor: { type: String, required: true },
      purchaseMode: { 
        type: String, 
        enum: ["kg", "meters"], 
        default: "kg" 
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      colors: [String],
      gsm: String,
      remarks: String,
    }
  ],

  // Purchase-specific fields for Buttons
  buttonsPurchases: [
    {
      productName: { type: String, required: true },
      size: { type: String, required: true },
      vendor: { type: String, required: true },
      purchaseMode: { 
        type: String, 
        enum: ["kg", "pieces"], 
        default: "pieces" 
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      buttonType: String, // plastic, metal, wooden, etc.
      color: String,
      remarks: String,
    }
  ],

  // Purchase-specific fields for Packets
  packetsPurchases: [
    {
      productName: { type: String, required: true },
      size: { type: String, required: true },
      vendor: { type: String, required: true },
      purchaseMode: { 
        type: String, 
        enum: ["pieces"], 
        default: "pieces" 
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      packetType: String, // polybag, box, etc.
      remarks: String,
    }
  ],

  // Total Purchase Costs
  totalFabricCost: { type: Number, default: 0 },
  totalButtonsCost: { type: Number, default: 0 },
  totalPacketsCost: { type: Number, default: 0 },
  grandTotalCost: { type: Number, default: 0 },

  // Purchase Status
  status: {
    type: String,
    enum: ["Pending", "Partial", "Completed"],
    default: "Pending"
  },

  // General remarks
  remarks: String,

}, { timestamps: true });

// Pre-save middleware to calculate total costs
PurchaseSchema.pre("save", function (next) {
  // Calculate fabric purchases total cost
  this.totalFabricCost = this.fabricPurchases.reduce((total, fabric) => {
    fabric.totalCost = (fabric.quantity || 0) * (fabric.costPerUnit || 0);
    return total + fabric.totalCost;
  }, 0);

  // Calculate buttons purchases total cost
  this.totalButtonsCost = this.buttonsPurchases.reduce((total, button) => {
    button.totalCost = (button.quantity || 0) * (button.costPerUnit || 0);
    return total + button.totalCost;
  }, 0);

  // Calculate packets purchases total cost
  this.totalPacketsCost = this.packetsPurchases.reduce((total, packet) => {
    packet.totalCost = (packet.quantity || 0) * (packet.costPerUnit || 0);
    return total + packet.totalCost;
  }, 0);

  // Calculate grand total
  this.grandTotalCost = this.totalFabricCost + this.totalButtonsCost + this.totalPacketsCost;

  next();
});

// Indexes
PurchaseSchema.index({ order: 1 });
PurchaseSchema.index({ PoNo: 1 });
PurchaseSchema.index({ buyerCode: 1 });
PurchaseSchema.index({ purchaseDate: -1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ orderType: 1 });

export default mongoose.model("Purchase", PurchaseSchema);