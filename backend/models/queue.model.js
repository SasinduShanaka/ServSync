import mongoose from 'mongoose';
import Session from './session.model.js';

const queueSchema = new mongoose.Schema({
  session: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Session', 
    required: true
  },
  tokens: [
    {
      tokenNumber: { type: Number, required: true },
      status: { type: String, enum: ['waiting', 'serving', 'completed'], default: 'waiting' },
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
      checkInTime: { type: Date, required: true },
      startTime: { type: Date },
      endTime: { type: Date }
    }
  ]
});

const Queue = mongoose.model('Queue', queueSchema);

export default Queue;
