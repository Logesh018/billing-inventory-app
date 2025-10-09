import Production from "./src/models/production.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {connectDB} from "./src/lib/db.js";

dotenv.config();

const productionDocuments = [
  // PO/2526/0001 (JOB-Works)
  {
    "order": "68d6de00d7dca50e645dd024",
    "orderDate": new Date("2025-09-26T00:00:00.000Z"),
    "PoNo": "PO/2526/0001",
    "orderType": "JOB-Works",
    "buyerCode": "BUY014",
    "buyerName": "BUY014",
    "products": [
      {
        "productName": "Lower",
        "fabricType": "N/A",
        "fabricColor": "Black",
        "sizes": [
          {
            "size": "S",
            "quantity": 8
          }
        ],
        "productTotalQty": 8
      }
    ],
    "totalQty": 8,
    "receivedFabric": "N/A",
    "goodsType": "Lower",
    "color": "Black",
    "requiredQty": 8,
    "expectedQty": 0,
    "status": "Pending Production",
    "buttonsPurchases": [],
    "packetsPurchases": [],
    "totalButtonsCost": 0,
    "totalPacketsCost": 0,
    "totalButtonsGst": 0,
    "totalPacketsGst": 0,
    "grandTotalCost": 0,
    "grandTotalWithGst": 0,
    "remarks": "Auto-generated for JOB-Works order",
    "workflowHistory": [
      {
        "stage": "Production",
        "status": "Pending Production",
        "date": new Date("2025-09-27T00:00:00.000Z"),
        "notes": "Auto-generated for JOB-Works order"
      }
    ]
  },
  // PO/2526/0002 (FOB)
  {
    "order": "68d7b34ec11a7d105f789f4f",
    "purchase": "68d7b34ec11a7d105f789f57",
    "orderDate": new Date("2025-09-27T00:00:00.000Z"),
    "PoNo": "PO/2526/0002",
    "orderType": "FOB",
    "buyerCode": "BUY014",
    "buyerName": "BUY014",
    "products": [
      {
        "productName": "Shorts",
        "fabricType": "Cotton",
        "fabricColor": "Blue",
        "sizes": [
          {
            "size": "X",
            "quantity": 50
          }
        ],
        "productTotalQty": 50
      }
    ],
    "totalQty": 50,
    "receivedFabric": "Cotton",
    "goodsType": "Shorts",
    "color": "Blue",
    "requiredQty": 50,
    "expectedQty": 0,
    "status": "Pending Production",
    "fabricPurchases": [],
    "buttonsPurchases": [],
    "packetsPurchases": [],
    "totalFabricCost": 0,
    "totalButtonsCost": 0,
    "totalPacketsCost": 0,
    "totalFabricGst": 0,
    "totalButtonsGst": 0,
    "totalPacketsGst": 0,
    "grandTotalCost": 0,
    "grandTotalWithGst": 0,
    "remarks": "Auto-generated for FOB order",
    "workflowHistory": [
      {
        "stage": "Production",
        "status": "Pending Production",
        "date": new Date("2025-09-27T00:00:00.000Z"),
        "notes": "Auto-generated for FOB order"
      }
    ]
  },
  // PO/2526/0003 (JOB-Works)
  {
    "order": "68da32e63edb7fe66dfb1efe",
    "orderDate": new Date("2025-09-29T00:00:00.000Z"),
    "PoNo": "PO/2526/0003",
    "orderType": "JOB-Works",
    "buyerCode": "BUY001",
    "buyerName": "BUY001",
    "products": [
      {
        "productName": "T Shirt",
        "fabricType": "N/A",
        "fabricColor": "Red, Pink",
        "sizes": [
          {
            "size": "M ",
            "quantity": 20
          }
        ],
        "productTotalQty": 20
      },
      {
        "productName": "T Shirt",
        "fabricType": "N/A",
        "fabricColor": "Blue, Green",
        "sizes": [
          {
            "size": "M",
            "quantity": 20
          }
        ],
        "productTotalQty": 20
      },
      {
        "productName": "T Shirt",
        "fabricType": "N/A",
        "fabricColor": "Red, Blue, Green, Pink",
        "sizes": [
          {
            "size": "S",
            "quantity": 40
          }
        ],
        "productTotalQty": 40
      }
    ],
    "totalQty": 80,
    "receivedFabric": "N/A",
    "goodsType": "T Shirt",
    "color": "Red, Pink, Blue, Green",
    "requiredQty": 80,
    "expectedQty": 0,
    "status": "Pending Production",
    "buttonsPurchases": [],
    "packetsPurchases": [],
    "totalButtonsCost": 0,
    "totalPacketsCost": 0,
    "totalButtonsGst": 0,
    "totalPacketsGst": 0,
    "grandTotalCost": 0,
    "grandTotalWithGst": 0,
    "remarks": "Auto-generated for JOB-Works order",
    "workflowHistory": [
      {
        "stage": "Production",
        "status": "Pending Production",
        "date": new Date("2025-09-29T00:00:00.000Z"),
        "notes": "Auto-generated for JOB-Works order"
      }
    ]
  }
];

export const recreateProductionDocuments = async () => {
  try {
    await connectDB(); // ✅ connect to MongoDB first
    console.log("✅ Connected to MongoDB");

    for (const doc of productionDocuments) {
      const production = new Production(doc);
      await production.save();
      console.log(`✅ Created production for ${doc.PoNo}`);
    }

    console.log("🎉 All production documents recreated successfully!");
    process.exit(); // Exit cleanly
  } catch (error) {
    console.error("❌ Error recreating production documents:", error);
    process.exit(1);
  }
};

recreateProductionDocuments();
