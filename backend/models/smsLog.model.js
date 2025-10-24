// src/models/smsLog.model.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const SmsLogSchema = new Schema({
  to: { type: String, required: true, index: true },
  message: { type: String, required: true },
  contact: { type: Object, default: {} },
  meta: { type: Object, default: {} }, // e.g., { kind: 'appointment_confirmation', bookingCode }

  status: { type: String, enum: ['queued', 'processing', 'retrying', 'sent', 'failed'], default: 'queued', index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: '' },
  nextAttemptAt: { type: Date, default: () => new Date(), index: true },
  providerResponse: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

SmsLogSchema.index({ status: 1, nextAttemptAt: 1 });

const SmsLog = mongoose.models?.SmsLog || model('SmsLog', SmsLogSchema);
export default SmsLog;
