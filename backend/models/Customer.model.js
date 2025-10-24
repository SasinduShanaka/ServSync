import mongoose from 'mongoose';
const { Schema } = mongoose;

const customerSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, index: true },
  phone: { type: String },
  branch: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
