import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

const ProductDetailsSchema = new mongoose.Schema({
  category: { type: String },
  name: { type: String, required: true },
  type: [{ type: String }],
  style: [{ type: String }],
  fabric: { type: String, required: true },
  color: { type: String, required: true },
}, { _id: false }); // _id is false because we don't need unique IDs for this sub-data

const OrderSchema = new mongoose.Schema({
  orderDate: { type: Date, required: true },
  PoNo: { type: String },
  orderType: { type: String, enum: ["FOB", "JOB-Works", "Own-Orders"], required: true },

  orderId: {
    type: String,
    unique: true,
    sparse: true
  },

  serialNo: { type: Number },
  fobSerialNo: { type: Number },
  jobWorksSerialNo: { type: Number },
  ownOrdersSerialNo: { type: Number },

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

      // 2. Use the explicitly defined schema here
      productDetails: {
        type: ProductDetailsSchema,
        default: {}
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
    default: "Pending Purchase"
  },

  purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  production: { type: mongoose.Schema.Types.ObjectId, ref: "Production" },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },

  // PDF Storage
  pdfUrl: { type: String },
  pdfPublicId: { type: String },
}, { timestamps: true });

OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderId) {
    try {
      const seq = await getNextSequence("globalOrderSeq");
      this.orderId = `OID-${String(seq).padStart(4, '0')}`;
      console.log(`✅ Generated global order serial: ${this.orderId}`);
    } catch (error) {
      console.error("❌ Error generating global order serial:", error);
      return next(error);
    }
  }
  next();
});

OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.serialNo) {
    try {
      let counterName, fieldName;
      switch (this.orderType) {
        case "FOB":
          counterName = "orderSeq_FOB";
          fieldName = "fobSerialNo";
          break;
        case "JOB-Works":
          counterName = "orderSeq_JOB";
          fieldName = "jobWorksSerialNo";
          break;
        case "Own-Orders":
          counterName = "orderSeq_OWN";
          fieldName = "ownOrdersSerialNo";
          break;
        default:
          return next(new Error(`Invalid order type: ${this.orderType}`));
      }
      const seq = await getNextSequence(counterName);
      this[fieldName] = seq;
      this.serialNo = seq;
      console.log(`✅ Generated ${this.orderType} serial #${seq}`);
    } catch (error) {
      console.error("❌ Error generating serial number:", error);
      return next(error);
    }
  }
  next();
});

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

OrderSchema.index({ PoNo: 1 }, { unique: true });
OrderSchema.index({ orderId: 1 }, { unique: true, sparse: true });
OrderSchema.index({ buyer: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderType: 1 });
OrderSchema.index({ serialNo: 1 });
OrderSchema.index({ fobSerialNo: 1 }, { sparse: true, unique: true });
OrderSchema.index({ jobWorksSerialNo: 1 }, { sparse: true, unique: true });
OrderSchema.index({ ownOrdersSerialNo: 1 }, { sparse: true, unique: true });

export default mongoose.model("Order", OrderSchema);