import Bank from '../models/bank.model.js';

export const listBanks = async (req, res, next) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const q = (search || '').trim().toUpperCase();
    const where = q ? { nameUpper: { $regex: q, $options: 'i' }, active: true } : { active: true };
    const list = await Bank.find(where).sort({ nameUpper: 1 }).limit(Number(limit) || 50).lean();
    res.json(list);
  } catch (e) { next(e); }
};

export const bulkUpsertBanks = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : (Array.isArray(req.body.items) ? req.body.items : []);
    if (!items.length) return res.status(400).json({ message: 'No banks provided' });

    const ops = items.map((b) => {
      const name = String(b.name || '').trim();
      const code = b.code ? String(b.code).trim() : undefined;
      const nameUpper = name.toUpperCase();
      const filter = code ? { $or: [{ code }, { nameUpper }] } : { nameUpper };
      const update = { $set: { name, code, active: b.active !== false } };
      return { updateOne: { filter, update, upsert: true } };
    });

    const result = await Bank.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, result });
  } catch (e) { next(e); }
};

export const getBank = async (req, res, next) => {
  try {
    const bank = await Bank.findById(req.params.bankId).lean();
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    res.json(bank);
  } catch (e) { next(e); }
};
