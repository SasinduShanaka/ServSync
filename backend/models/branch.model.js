// src/models/Branch.model.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CounterSchema = new Schema({
  name: { type: String, required: true },
  insuranceType: { type: Types.ObjectId, ref: 'InsuranceType', required: true },
  isActive: { type: Boolean, default: true }
}, { _id: true });

const BranchSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // e.g., NITF-CMB-01
  address: { type: String, required: true },
  counters: [CounterSchema]
}, { timestamps: true });

BranchSchema.index({ code: 1 }, { unique: true });

export default model('Branch', BranchSchema);
