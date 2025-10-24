// Centralized Joi schemas and validation middleware for complaints & feedback
// This file adds structured validation to ensure incoming request bodies are sanitized
// and meet minimum requirements before proceeding to controllers.

import Joi from 'joi';

// Common helpers
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } });
const nonEmptyString = Joi.string().trim().min(1);
const optionalNonEmpty = Joi.string().trim().allow('').optional();

// Complaint creation schema
export const complaintCreateSchema = Joi.object({
  name: nonEmptyString.min(2).max(100).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters'
  }),
  email: email.required().messages({ 'string.email': 'Valid email is required' }),
  phone: optionalNonEmpty.max(30),
  branch: Joi.string().trim().max(100).allow('', null),
  category: Joi.string().trim().max(100).required().messages({ 'any.required': 'Category is required' }),
  description: nonEmptyString.min(10).max(2000).required().messages({
    'string.min': 'Description must be at least 10 characters'
  }),
  attachment: Joi.object({
    fileName: nonEmptyString.max(255),
    fileUrl: nonEmptyString.uri().max(2048),
    size: Joi.number().min(0).max(5 * 1024 * 1024), // up to 5MB
    mimetype: nonEmptyString.max(100)
  }).optional()
});

// Complaint status update schema
export const complaintStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'resolved', 'escalated').optional(),
  responseNotes: Joi.string().trim().allow('').max(4000).optional()
});

// Public complaint edit schema
export const complaintPublicUpdateSchema = Joi.object({
  email: email.required(),
  category: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().min(10).max(2000).optional()
});

// Feedback creation schema
export const feedbackCreateSchema = Joi.object({
  username: Joi.string().trim().min(2).max(100).allow('', null),
  email: email.required(),
  message: nonEmptyString.min(5).max(2000).required(),
  rating: Joi.number().integer().min(1).max(5).required()
});

// Feedback update schema
export const feedbackUpdateSchema = Joi.object({
  message: Joi.string().trim().min(5).max(2000).optional(),
  rating: Joi.number().integer().min(1).max(5).optional()
}).or('message', 'rating');

// Feedback reply schema
export const feedbackReplySchema = Joi.object({
  sender: Joi.string().valid('admin', 'user').required(),
  message: nonEmptyString.min(2).max(1000).required(),
  email: email.when('sender', { is: 'user', then: email.required(), otherwise: email.optional() })
});

// Reply update schema
export const feedbackReplyUpdateSchema = Joi.object({
  message: nonEmptyString.min(2).max(1000).required(),
  requesterEmail: email.optional(),
  asAdmin: Joi.boolean().optional()
});

// Generic validator factory
export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }
    req.body = value; // sanitized
    next();
  };
}

// Central error handler for unexpected Joi errors (fallback)
export function validationErrorHandler(err, req, res, next) {
  if (err && err.isJoi) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      details: err.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
  }
  next(err);
}
