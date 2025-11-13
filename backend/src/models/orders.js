import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderDate: { type: Date, required: true },
  PoNo: { type: String },
  orderType: { type: String, enum: ["FOB", "JOB-Works", "Own-Orders"], required: true },

  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },
  buyerDetails: {
    name: { type: String, required: true },
    code: { type: String, required: true },
    mobile: { type: String, required: true },
    gst: String,
    email: String,
    address: String,
  },

  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

      productDetails: {
        name: { type: String, required: true },
        style: { type: String, required: true },
        color: { type: String, required: true },
        fabricType: { type: String, required: true },
      },
      sizes: [
        {
          size: { type: String, required: true },
          qty: { type: Number, required: true, min: 1 },
        }
      ],
      productTotalQty: { type: Number, default: 0 },
    },
  ],

  totalQty: { type: Number, default: 0 },

  status: {
    type: String,
    enum: [
      "Pending Purchase",
      "Purchase Completed",
      "Pending Production",
      "Factory Received",
      "In Production",
      "Production Completed",
      "Ready for Delivery",
      "Delivered",
      "Completed"
    ],
    default: function () {
      return "Pending Purchase";
    }
  },

  purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  production: { type: mongoose.Schema.Types.ObjectId, ref: "Production" },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },

}, { timestamps: true });

// Pre-save middleware to populate buyerDetails
OrderSchema.pre("save", async function (next) {
  try {
    if (!this.buyerDetails.code && this.buyer) {
      const buyer = await mongoose.model("Buyer").findById(this.buyer).select("code");
      if (buyer && buyer.code) {
        this.buyerDetails.code = buyer.code;
      } else {
        throw new Error("Buyer code not found");
      }
    }
  } catch (error) {
    return next(error);
  }
  next();
});

// Calculate all totals before saving
OrderSchema.pre("save", function (next) {
  if (this.products && this.products.length > 0) {
    this.products.forEach((product) => {
      let productTotal = 0;

      if (product.sizes && product.sizes.length > 0) {
        productTotal = product.sizes.reduce((acc, size) => acc + (size.qty || 0), 0);
      }

      product.productTotalQty = productTotal;
    });

    this.totalQty = this.products.reduce(
      (acc, product) => acc + (product.productTotalQty || 0), 0
    );
  } else {
    this.totalQty = 0;
  }
  next();
});

// Indexes
OrderSchema.index({ PoNo: 1 }, { unique: true });
OrderSchema.index({ buyer: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderType: 1 });

export default mongoose.model("Order", OrderSchema);