// models/Settlement.js

import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    sprovid: {
      type: String,
      required: true,
      index: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },

    totalOrders: Number,
    totalAmount: Number,

    settledAt: {
      type: Date,
      default: Date.now,
    },

    settledBy: String,
  },
  { timestamps: true }
);

export default mongoose.model("Settlement", settlementSchema);