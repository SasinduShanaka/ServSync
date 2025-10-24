import mongoose from "mongoose";
const { Schema } = mongoose;

const complaintSchema = new Schema({
  referenceId: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      return `NITF-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
  },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  category: String,
  description: { type: String, required: true },
  status: { type: String, enum: ["pending", "in-progress", "resolved", "escalated"], default: "pending" },
  responseNotes: String,
  branch: String,
  attachment: {
    fileName: String,
    fileUrl: String,
    size: Number,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  logs: [
    {
      actor: String,
      action: String,
      note: String,
      at: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
