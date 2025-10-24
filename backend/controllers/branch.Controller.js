// src/controllers/branch.controller.js
import Branch from '../models/branch.model.js';
import Session from '../models/session.model.js';

// Create a new branch
export const createBranch = async (req, res, next) => {
  try {
    const { name, code, address, counters = [] } = req.body;
    const doc = await Branch.create({ name, code, address, counters });
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

// Add a counter to an existing branch
export const addCounter = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { name, insuranceType, isActive = true } = req.body;
    // Ensure branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    // Prevent duplicate counter name within the same branch (case-insensitive)
    const incoming = (name || '').trim().toLowerCase();
    if (!incoming) return res.status(400).json({ message: 'Counter name is required' });
    const dup = branch.counters.find(c => String(c.name || '').trim().toLowerCase() === incoming);
    if (dup) return res.status(400).json({ message: 'Counter name already exists in this branch' });

    branch.counters.push({ name: name.trim(), insuranceType, isActive });
    await branch.save();
    res.json(branch.toObject());
  } catch (e) { next(e); }
};

// Remove a counter from a branch (safety: prevent delete when sessions reference the counter)
export const deleteCounter = async (req, res, next) => {
  try {
    const { branchId, counterId } = req.params;
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    // If any sessions reference this counter and are not completed, block deletion
    const activeSession = await Session.findOne({ counterId, status: { $in: ['SCHEDULED','RUNNING'] } }).lean();
    if (activeSession) return res.status(409).json({ message: 'Cannot delete counter with active or scheduled sessions' });

    const doc = await Branch.findByIdAndUpdate(branchId, { $pull: { counters: { _id: counterId } } }, { new: true }).lean();
    res.json(doc);
  } catch (e) { next(e); }
};

// Retrieve a single branch by id
export const getBranch = async (req, res, next) => {
  try {
    const doc = await Branch.findById(req.params.branchId).lean();
    res.json(doc);
  } catch (e) { next(e); }
};

// List all branches (useful for frontend dropdowns)
export const listBranches = async (req, res, next) => {
  try {
    const list = await Branch.find().lean();
    res.json(list);
  } catch (e) { next(e); }
};


