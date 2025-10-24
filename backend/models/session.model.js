// src/models/Session.model.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const SlotSchema = new Schema({
  slotId: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId(), immutable: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 },
  booked: { type: Number, default: 0, min: 0 },
  overbook: { type: Number, default: 0 }
}, { _id: false });

const SessionSchema = new Schema({
  branch: { type: Types.ObjectId, ref: 'Branch', required: true },
  counterId: { type: Types.ObjectId, required: true }, // refers to Branch.counters._id
  insuranceType: { type: Types.ObjectId, ref: 'InsuranceType', required: true },
  serviceDate: { type: Date, required: true }, // UTC day (00:00Z)
  slots: [SlotSchema],
  activeSlotId: { type: Types.ObjectId, default: null },
  metrics: {
    waitingCount: { type: Number, default: 0 },
    servedCount: { type: Number, default: 0 },
    avgWaitSec: { type: Number, default: 0 },
    avgServiceSec: { type: Number, default: 0 },
    oldestWaitSec: { type: Number, default: 0 }
  },
  version: { type: Number, default: 0 },
  status: { type: String, enum: ['SCHEDULED','RUNNING','COMPLETED','CANCELLED'], default: 'SCHEDULED', index: true },
  holidaysFlag: { type: Boolean, default: false }
}, { timestamps: true });

SessionSchema.index({ branch:1, counterId:1, serviceDate:1 }, { unique: true });
SessionSchema.index({ branch:1, insuranceType:1, serviceDate:1 });
// Optional analytics index
SessionSchema.index({ insuranceType:1, serviceDate:1 });

SessionSchema.pre('validate', function(next){
  try {
    const day = this.serviceDate.toISOString().slice(0,10); // YYYY-MM-DD
    const ranges = this.slots.map(s => {
      if (s.startTime >= s.endTime) throw new Error('Slot start must be before end');
      const sameDay = s.startTime.toISOString().startsWith(day) && s.endTime.toISOString().startsWith(day);
      if (!sameDay) throw new Error('Slots must be within serviceDate day (UTC)');
      return [s.startTime.getTime(), s.endTime.getTime()];
    }).sort((a,b)=>a[0]-b[0]);
    for (let i=1;i<ranges.length;i++){
      if (ranges[i][0] < ranges[i-1][1]) throw new Error('Overlapping slots');
    }
    next();
  } catch (e) { next(e); }
});

// Avoid OverwriteModelError when using nodemon/hot reload
const Session = mongoose.models?.Session || model('Session', SessionSchema);
export default Session;
