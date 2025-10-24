// src/models/appointmentCounter.model.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const AppointmentCounterSchema = new Schema({
  branch: { type: Types.ObjectId, ref: 'Branch', required: true, index: true },
  insuranceType: { type: Types.ObjectId, ref: 'InsuranceType', required: true, index: true },
  // UTC day 00:00:00Z for the session date
  serviceDate: { type: Date, required: true, index: true },
  nextSeq: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

AppointmentCounterSchema.index({ branch: 1, insuranceType: 1, serviceDate: 1 }, { unique: true });

const AppointmentCounter = mongoose.models?.AppointmentCounter || model('AppointmentCounter', AppointmentCounterSchema);
export default AppointmentCounter;
