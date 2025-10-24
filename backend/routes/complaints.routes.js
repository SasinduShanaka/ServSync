import { Router } from 'express';
import * as ComplaintController from '../controllers/Complaint.Controller.js';
import Complaint from '../models/Complaint.model.js'; // model import
// Added validation middleware to enforce request schema integrity
import { 
  validateBody, 
  complaintCreateSchema, 
  complaintStatusUpdateSchema, 
  complaintPublicUpdateSchema 
} from '../middleware/validation.js';


const router = Router();

// Create a new complaint (validated & sanitized)
router.post('/', validateBody(complaintCreateSchema), ComplaintController.createComplaint);

// Update complaint status/response (validated)
router.put('/:id/status', validateBody(complaintStatusUpdateSchema), ComplaintController.updateComplaintStatus);

// Get all complaints (optional ?email filter)
router.get('/', ComplaintController.getAllComplaints);

// Get complaint analytics
router.get('/analytics/overview', ComplaintController.getComplaintAnalytics);

// Get complaint by referenceId
router.get('/ref/:referenceId', ComplaintController.getComplaintByReferenceId);

// Get complaint by Mongo _id
router.get('/:id', ComplaintController.getComplaintById);

// Public update/delete by owner (email must match) - validated
router.put('/:id', validateBody(complaintPublicUpdateSchema), ComplaintController.updateComplaintPublic);
router.delete('/:id', ComplaintController.deleteComplaintPublic);

// Respond to a complaint
router.post('/:id/respond', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { response: req.body.response },
      { new: true }
    );
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
