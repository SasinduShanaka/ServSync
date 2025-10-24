import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const AuditEventSchema = new Schema({
  entityType: { type: String, enum: ['token','claim','session','document','counter'], required: true },
  entityId: { type: Types.ObjectId, required: true },
  action: { type: String, required: true },
  by: { type: Types.ObjectId, default: null },
  at: { type: Date, default: () => new Date() },
  diff: { type: Schema.Types.Mixed }
}, { timestamps: true });

AuditEventSchema.index({ entityType:1, entityId:1, at:-1 });
AuditEventSchema.index({ action:1, at:-1 });

const AuditEvent = mongoose.models?.AuditEvent || model('AuditEvent', AuditEventSchema);
export default AuditEvent;
