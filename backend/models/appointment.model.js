// src/models/appointment.model.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const AppointmentDocumentSchema = new Schema({
  key: { type: String, required: true }, // e.g., claimForm, hospitalBill
  fileUrl: { type: String, required: true },
  fileMeta: { type: Object, default: {} },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const AppointmentSchema = new Schema({
  bookingCode: { type: String, required: true, unique: true, index: true },
  sessionId: { type: Types.ObjectId, ref: 'Session', required: true, index: true },
  slotId: { type: Types.ObjectId, required: true },
  branchId: { type: Types.ObjectId, ref: 'Branch', required: true, index: true },
  insuranceTypeId: { type: Types.ObjectId, ref: 'InsuranceType', required: true, index: true },
  customer: {
    userId: { type: Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    nic: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  status: { type: String, enum: ['booked', 'cancelled', 'checked_in', 'no_show'], default: 'booked', index: true },
  documents: { type: [AppointmentDocumentSchema], default: [] },
  // Check-in tracking (set by receptionist)
  checkedInAt: { type: Date, default: null },
  checkedInBy: { type: String, default: null },
  isOverride: { type: Boolean, default: false },
  overrideReason: { type: String, default: null }
}, { timestamps: true });

AppointmentSchema.index({ slotId: 1, status: 1 });

const Appointment = mongoose.models?.Appointment || model('Appointment', AppointmentSchema);
export default Appointment;
