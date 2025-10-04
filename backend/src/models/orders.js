import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderDate: { type: Date, required: true },
  PoNo: { type: String },
  orderType: { type: String, enum: ["FOB", "JOB-Works"], required: true },

  // Buyer Reference + Snapshot
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },
  buyerDetails: {
    name: { type: String, required: true },
    code: { type: String, required: true },
    mobile: { type: String, required: true },
    gst: String,
    email: String,
    address: String,
  },

  // Products with the complex tree structure
  products: [
    {
      // Reference to Product collection
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

      // Product snapshot
      productDetails: {
        name: { type: String, required: true },
        hsn: { type: String, required: true },
      },

      // Fabric Types array (first level of tree)
      fabricTypes: [
        {
          fabricType: { type: String, required: true }, // "Airtex", "Single Jersey", etc.

          // Sizes array (second level of tree)
          sizes: [
            {
              size: { type: String, required: true }, // "S", "M", "L", etc.

              // Colors array (third level of tree)
              colors: [
                {
                  color: { type: String, required: true },
                  qty: { type: Number, required: true, min: 1 },
                }
              ],

              sizeTotalQty: { type: Number, default: 0 }, // Total for this size
            }
          ],

          fabricTotalQty: { type: Number, default: 0 }, // Total for this fabric type
        }
      ],

      productTotalQty: { type: Number, default: 0 }, // Total for this product
    },
  ],

  // Calculated totals
  totalQty: { type: Number, default: 0 },

  // Order Status for workflow tracking
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
      return this.orderType === "FOB" ? "Pending Purchase" : "Pending Production";
    }
  },

  // Workflow References
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

      if (product.fabricTypes && product.fabricTypes.length > 0) {
        product.fabricTypes.forEach((fabricType) => {
          let fabricTotal = 0;

          if (fabricType.sizes && fabricType.sizes.length > 0) {
            fabricType.sizes.forEach((size) => {
              let sizeTotal = 0;

              if (size.colors && size.colors.length > 0) {
                sizeTotal = size.colors.reduce((acc, color) => acc + (color.qty || 0), 0);
              }

              size.sizeTotalQty = sizeTotal;
              fabricTotal += sizeTotal;
            });
          }

          fabricType.fabricTotalQty = fabricTotal;
          productTotal += fabricTotal;
        });
      }

      product.productTotalQty = productTotal;
    });

    // Calculate total quantity for entire order
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