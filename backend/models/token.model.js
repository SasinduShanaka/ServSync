import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const TokenSchema = new Schema({
  session: { type: Types.ObjectId, ref: 'Session', required: true, index: true },
  branch: { type: Types.ObjectId, ref: 'Branch', required: true, index: true },
  insuranceType: { type: Types.ObjectId, ref: 'InsuranceType', required: true, index: true },
  slotId: { type: Types.ObjectId, required: true, index: true },

  // Token number displayed to the customer, e.g., A-023
  tokenNo: { type: String, required: true },
  // Normalized UTC date (00:00Z) of the service day this token belongs to
  serviceDate: { type: Date, required: true, index: true },
  source: { type: String, enum: ['appointment', 'walkin'], default: 'walkin' },
  appointmentId: { type: Types.ObjectId, default: null },
  customerId: { type: Types.ObjectId, default: null },
  customer: {
    name: String,
    nic: String,
    phone: String
  },
  priority: { type: String, enum: ['normal', 'elderly', 'pregnant', 'disabled'], default: 'normal' },

  status: { type: String, enum: ['waiting', 'called', 'serving', 'completed', 'skipped', 'no_show', 'transferred'], default: 'waiting', index: true },
  currentCounterId: { type: Types.ObjectId, default: null, index: true },

  timing: {
    arrivedAt: { type: Date, required: true, default: () => new Date() },
    firstCallAt: { type: Date },
    serviceStartAt: { type: Date },
    endedAt: { type: Date }
  },

  meta: {
    skips: { type: Number, default: 0 },
    transferCount: { type: Number, default: 0 },
    overbook: { type: Boolean, default: false }
  },

  history: [{
    at: { type: Date, default: () => new Date() },
    by: { type: Types.ObjectId }, // could be counterId or userId later
    action: { type: String, required: true },
    note: { type: String },
    data: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

// Indexes for fast operations
TokenSchema.index({ session: 1, status: 1, 'timing.arrivedAt': 1 });
TokenSchema.index({ currentCounterId: 1, status: 1 });
TokenSchema.index({ branch: 1, insuranceType: 1, slotId: 1, status: 1 });
// Ensure the same tokenNo is unique within a branch and serviceDate
TokenSchema.index({ branch: 1, serviceDate: 1, tokenNo: 1 }, { unique: true });

const Token = mongoose.models?.Token || model('Token', TokenSchema);
export default Token;
