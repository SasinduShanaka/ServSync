import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const BankSchema = new Schema({
  name: { type: String, required: true },
  nameUpper: { type: String, unique: true, index: true },
  code: { type: String, unique: true, sparse: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

BankSchema.pre('save', function(next){
  if (this.name) this.nameUpper = String(this.name).trim().toUpperCase();
  next();
});

export default model('Bank', BankSchema);
