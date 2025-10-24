import Claim from '../models/claim.model.js';
import AuditEvent from '../models/auditEvent.model.js';
import Token from '../models/token.model.js';
import Appointment from '../models/appointment.model.js';

export async function listClaims({ status }){
  const q = {};
  if (status) q.status = status;
  return Claim.find(q).sort({ createdAt: -1 }).lean();
}

export async function getOrCreateClaim({ tokenId, session, branch, insuranceType }){
  let claim = await Claim.findOne({ tokenId });
  if (claim) return claim;

  // Derive missing fields from Token (and Appointment for documents)
  const token = await Token.findById(tokenId).lean();
  if (!token) throw new Error('Token not found for claim');
  const derived = {
    session: session || token.session,
    branch: branch || token.branch,
    insuranceType: insuranceType || token.insuranceType,
  };

  // Seed documents from appointment if available
  const docs = [];
  if (token.appointmentId) {
    const appt = await Appointment.findById(token.appointmentId).lean();
    (appt?.documents || []).forEach(d => {
      docs.push({ name: d.key, fileUrl: d.fileUrl || '', status: 'pending', reason: '' });
    });
  }

  claim = await Claim.create({ tokenId, ...derived, documents: docs });
  await AuditEvent.create({ entityType:'claim', entityId: claim._id, action:'create' });
  return claim;
}

export async function updateClaim({ tokenId, updates }){
  const claim = await Claim.findOneAndUpdate({ tokenId }, { $set: updates }, { new: true, upsert: true });
  await AuditEvent.create({ entityType:'claim', entityId: claim._id, action:'update', diff: updates });
  return claim;
}

export async function approveClaim({ tokenId, payload, actorId }){
  // Only allow approving claims that are ready for assessment
  const updates = {
    status: 'approved',
  };
  if (payload?.note) {
    updates.$push = { notes: { at: new Date(), by: actorId || null, text: payload.note } };
  }
  const claim = await Claim.findOneAndUpdate(
    { tokenId, status: { $in: ['ready_for_assessment'] } },
    { $set: updates, ...(payload?.note ? { $push: { notes: { at: new Date(), by: actorId || null, text: payload.note } } } : {}) },
    { new: true }
  );
  if (!claim) throw new Error('Claim not in approvable state');
  await AuditEvent.create({ entityType:'claim', entityId: claim._id, action:'approve', by: actorId });
  return claim;
}

export async function payClaim({ tokenId, payload, actorId }){
  // Record payout details if provided and mark as paid
  const set = { status: 'paid' };
  if (payload?.payout) set.payout = { ...payload.payout, consent: true };
  if (payload?.financials) set.financials = payload.financials;

  const updateOps = { $set: set };
  if (payload?.note) {
    updateOps.$push = { notes: { at: new Date(), by: actorId || null, text: payload.note } };
  }

  const claim = await Claim.findOneAndUpdate(
    { tokenId, status: { $in: ['approved'] } },
    updateOps,
    { new: true }
  );
  if (!claim) throw new Error('Claim not in payable state');
  await AuditEvent.create({ entityType:'claim', entityId: claim._id, action:'pay', by: actorId, diff: set });
  return { message: 'Payment processed', claim };
}
