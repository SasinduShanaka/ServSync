import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema({
  sender: { type: String, required: true }, // "admin" or "user"
  message: { type: String, required: true },
  email: { type: String }, // Optional, required for user replies
}, { timestamps: true });

const FeedbackSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  replies: [ReplySchema],
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
