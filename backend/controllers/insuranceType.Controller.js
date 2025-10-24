// src/controllers/insuranceType.controller.js
import InsuranceType from '../models/insuranceType.model.js';

export const createInsuranceType = async (req, res, next) => {
  try {
    const doc = await InsuranceType.create({ name: req.body.name, description: req.body.description || '' });
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

export const listInsuranceTypes = async (req, res, next) => {
  try {
    const list = await InsuranceType.find().lean();
    res.json(list);
  } catch (e) { next(e); }
};

export const getInsuranceTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await InsuranceType.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
};
