import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const BankBranchSchema = new Schema({
  bank: { type: Types.ObjectId, ref: 'Bank', required: true, index: true },
  name: { type: String, required: true },
  nameUpper: { type: String, index: true },
  city: { type: String, default: '' },
  cityUpper: { type: String, index: true },
  code: { type: String, sparse: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

BankBranchSchema.index({ bank: 1, nameUpper: 1 }, { unique: true });

BankBranchSchema.pre('save', function(next){
  if (this.name) this.nameUpper = String(this.name).trim().toUpperCase();
  if (this.city) this.cityUpper = String(this.city).trim().toUpperCase();
  next();
});

export default model('BankBranch', BankBranchSchema);
