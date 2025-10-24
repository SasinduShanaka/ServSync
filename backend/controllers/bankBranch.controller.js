import Bank from '../models/bank.model.js';
import BankBranch from '../models/bankBranch.model.js';

export const listBranches = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const { search = '', limit = 100 } = req.query;
    const bank = await Bank.findById(bankId).lean();
    if (!bank) return res.status(404).json({ message: 'Bank not found' });

    const q = (search || '').trim().toUpperCase();
    const where = { bank: bankId, active: true };
    if (q) where.$or = [
      { nameUpper: { $regex: q, $options: 'i' } },
      { cityUpper: { $regex: q, $options: 'i' } }
    ];

    const list = await BankBranch.find(where).sort({ nameUpper: 1 }).limit(Number(limit) || 100).lean();
    res.json(list);
  } catch (e) { next(e); }
};

export const bulkUpsertBranches = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const bank = await Bank.findById(bankId).lean();
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    const items = Array.isArray(req.body) ? req.body : (Array.isArray(req.body.items) ? req.body.items : []);
    if (!items.length) return res.status(400).json({ message: 'No branches provided' });

    const ops = items.map((br) => {
      const name = String(br.name || br.city || '').trim();
      const city = br.city ? String(br.city).trim() : '';
      const code = br.code ? String(br.code).trim() : undefined;
      const nameUpper = name.toUpperCase();
      const filter = { bank: bankId, nameUpper };
      const update = { $set: { bank: bankId, name, city, code, active: br.active !== false } };
      return { updateOne: { filter, update, upsert: true } };
    });

    const result = await BankBranch.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, result });
  } catch (e) { next(e); }
};
