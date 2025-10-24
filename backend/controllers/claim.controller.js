import * as svc from '../services/claim.service.js';

export async function list(req, res){
  try { const claims = await svc.listClaims({ status: req.query.status }); res.json(claims); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function getOrCreate(req, res){
  try { const claim = await svc.getOrCreateClaim(req.body); res.json(claim); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function update(req, res){
  try { const claim = await svc.updateClaim({ tokenId: req.params.tokenId, updates: req.body }); res.json(claim); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function approve(req, res){
  try { const claim = await svc.approveClaim({ tokenId: req.params.tokenId, payload: req.body, actorId: req.user?._id }); res.json(claim); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function pay(req, res){
  try { const result = await svc.payClaim({ tokenId: req.params.tokenId, payload: req.body, actorId: req.user?._id }); res.json(result); }
  catch (e) { res.status(400).json({ message: e.message }); }
}
