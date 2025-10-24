import * as svc from '../services/token.service.js';

export async function createToken(req, res){
  try {
    const token = await svc.createToken(req.body);
    res.status(201).json(token);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

export async function listWaiting(req, res){
  try {
    const { sessionId, counterId, slotId, limit } = req.query;
    const items = await svc.listWaiting({ sessionId, counterId, slotId, limit: Number(limit)||20 });
    res.json({ tokens: items });
  } catch (e) { res.status(400).json({ message: e.message }); }
}

export async function popNext(req, res){
  try { const { sessionId, counterId, slotId } = req.body; const token = await svc.popNextWaiting({ sessionId, counterId, slotId }); res.json(token); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function recall(req, res){
  try { const { tokenId, counterId } = req.body; const token = await svc.recallToken({ tokenId, counterId }); res.json(token); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function start(req, res){
  try { const { tokenId, counterId } = req.body; const token = await svc.startService({ tokenId, counterId }); res.json(token); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function complete(req, res){
  try { const { tokenId, counterId } = req.body; const token = await svc.endService({ tokenId, counterId }); res.json(token); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function skip(req, res){
  try { const { tokenId, counterId } = req.body; const token = await svc.skipToken({ tokenId, counterId }); res.json(token); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function transfer(req, res){
  try { const { tokenId, toCounterId, byCounterId } = req.body; const token = await svc.transferToken({ tokenId, toCounterId, byCounterId }); res.json(token); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function getCurrent(req, res){
  try {
    const { tokenId, sessionId, counterId } = req.query;
    if (!tokenId && !(sessionId && counterId)) {
      return res.status(400).json({ message: 'Provide tokenId or sessionId+counterId' });
    }
    const token = await svc.getCurrentToken({ tokenId, sessionId, counterId });
    res.json({ token });
  } catch (e) { res.status(400).json({ message: e.message }); }
}

export async function listBySession(req, res){
  try{
    const { sessionId, slotId, statuses } = req.query;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
    const statusArr = statuses ? String(statuses).split(',').filter(Boolean) : undefined;
    const items = await svc.listBySession({ sessionId, slotId, statuses: statusArr });
    res.json({ tokens: items });
  } catch(e){ res.status(400).json({ message: e.message }); }
}

export async function returnToWaiting(req, res){
  try{
    const { tokenId } = req.body || {};
    if (!tokenId) return res.status(400).json({ message: 'tokenId required' });
    const token = await svc.returnToWaiting({ tokenId });
    res.json(token);
  }catch(e){ res.status(400).json({ message: e.message }); }
}
