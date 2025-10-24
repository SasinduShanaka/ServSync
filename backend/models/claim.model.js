import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const DocumentSchema = new Schema({
  name: { type: String, required: true },
  fileId: { type: Types.ObjectId, default: null },
  fileUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'verified', 'rejected', 'needs_reupload'], default: 'pending' },
  reason: { type: String, default: '' },
  history: [{ at: { type: Date, default: () => new Date() }, by: { type: Types.ObjectId }, status: String, note: String }]
});

const ClaimSchema = new Schema({
  tokenId: { type: Types.ObjectId, ref: 'Token', required: true, unique: true },
  session: { type: Types.ObjectId, ref: 'Session', required: true },
  branch: { type: Types.ObjectId, ref: 'Branch', required: true },
  insuranceType: { type: Types.ObjectId, ref: 'InsuranceType', required: true },
  claimType: { type: String, default: 'default' },

  documents: [DocumentSchema],

  financials: {
    estimatedAmount: { type: Number, default: 0 },
    approvedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'LKR' }
  },

  payout: {
    bankName: String,
    branch: String,
    accountHolder: String,
    accountNumber: String,
    accountType: { type: String, enum: ['savings', 'current', 'other'], default: 'savings' },
    consent: { type: Boolean, default: false }
  },

  notes: [{ at: { type: Date, default: () => new Date() }, by: { type: Types.ObjectId }, text: String }],

  // Status flow: draft -> ready_for_assessment -> approved -> paid
  status: { type: String, enum: ['draft', 'ready_for_assessment', 'approved', 'paid', 'needs_reupload'], default: 'draft' }
}, { timestamps: true });

ClaimSchema.index({ branch: 1, insuranceType: 1, status: 1 });

const Claim = mongoose.models?.Claim || model('Claim', ClaimSchema);
export default Claim;
