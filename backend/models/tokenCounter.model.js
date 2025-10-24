// src/models/tokenCounter.model.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const TokenCounterSchema = new Schema({
  branch: { type: Types.ObjectId, ref: 'Branch', required: true, index: true },
  // Normalized UTC date at 00:00:00.000Z representing the service day
  serviceDate: { type: Date, required: true, index: true },
  nextSeq: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

TokenCounterSchema.index({ branch: 1, serviceDate: 1 }, { unique: true });

const TokenCounter = mongoose.models?.TokenCounter || model('TokenCounter', TokenCounterSchema);
export default TokenCounter;
