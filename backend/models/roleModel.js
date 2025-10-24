import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const roleSchema = new Schema({
    nic: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    workArea: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: String, default: 'inactive', required: true },
    // Assignments: 
    // - Manager, Receptionist - branch required
    // - Officer (Customer Care Officer) - branch and counter required
    branch: { type: Types.ObjectId, ref: 'Branch', default: null },
    counter: { type: Types.ObjectId, default: null }, // references Branch.counters[_id]
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Export as default for ES Module
const Role = mongoose.model('roleModel', roleSchema);
export default Role;
