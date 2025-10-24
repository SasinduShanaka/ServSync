import { Router } from "express";
import * as FeedbackController from "../controllers/Feedback.Controller.js";
import Feedback from "../models/Feedback.models.js";
// Added validation middleware for structured input checking
import { 
  validateBody, 
  feedbackCreateSchema, 
  feedbackUpdateSchema, 
  feedbackReplySchema, 
  feedbackReplyUpdateSchema 
} from '../middleware/validation.js';

const router = Router();

// Feedback endpoints
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// Create feedback (validated)
router.post("/", validateBody(feedbackCreateSchema), async (req, res) => {
  try {
    const fb = new Feedback(req.body); // body already sanitized
    await fb.save();
    res.json(fb);
  } catch (err) {
    res.status(400).json({ error: true, message: err.message || "Failed to add feedback" });
  }
});

router.put("/:id", validateBody(feedbackUpdateSchema), FeedbackController.updateFeedback);
router.delete("/:id", FeedbackController.deleteFeedback);
router.post("/:id/reply", validateBody(feedbackReplySchema), FeedbackController.addReply);
// Update a reply (validated)
router.put('/:id/reply/:replyId', validateBody(feedbackReplyUpdateSchema), FeedbackController.updateReply);
// Delete a reply (no body validation needed aside from optional fields handled in controller)
router.delete('/:id/reply/:replyId', FeedbackController.deleteReply);

// Analytics endpoint
router.get("/analytics", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    
    // Calculate analytics
    const totalFeedbacks = feedbacks.length;
    const avgRating = totalFeedbacks > 0 
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedbacks).toFixed(1)
      : 0;
    
    const respondedCount = feedbacks.filter(f => 
      f.replies?.some(r => r.sender === 'admin')
    ).length;
    const responseRate = totalFeedbacks > 0 
      ? ((respondedCount / totalFeedbacks) * 100).toFixed(1)
      : 0;
    
    const excellentCount = feedbacks.filter(f => (f.rating || 0) >= 4.5).length;
    const satisfactionRate = totalFeedbacks > 0 
      ? ((excellentCount / totalFeedbacks) * 100).toFixed(1)
      : 0;

    // Rating distribution
    const ratingDistribution = feedbacks.reduce((acc, f) => {
      const rating = Math.floor(f.rating || 0);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    // Response status distribution
    const responseDistribution = {
      responded: respondedCount,
      pending: totalFeedbacks - respondedCount
    };

    // Monthly trend (last 12 months)
    const monthlyTrend = {};
    feedbacks.forEach(f => {
      if (f.createdAt) {
        const date = new Date(f.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTrend[monthKey]) {
          monthlyTrend[monthKey] = { count: 0, totalRating: 0 };
        }
        monthlyTrend[monthKey].count++;
        monthlyTrend[monthKey].totalRating += (f.rating || 0);
      }
    });

    res.json({
      summary: {
        totalFeedbacks,
        avgRating: parseFloat(avgRating),
        responseRate: parseFloat(responseRate),
        satisfactionRate: parseFloat(satisfactionRate),
        respondedCount
      },
      distributions: {
        rating: ratingDistribution,
        response: responseDistribution
      },
      trends: {
        monthly: monthlyTrend
      },
      feedbacks: feedbacks // Include raw data for detailed analysis
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback analytics" });
  }
});

export default router;
