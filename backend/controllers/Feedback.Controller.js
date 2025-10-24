import Feedback from "../models/Feedback.models.js";

// Update Feedback (Admin only)
export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, rating } = req.body;
    const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ error: true, message: 'Feedback not found' });

    if (typeof message === 'string' && message.trim()) feedback.message = message;
    if (typeof rating === 'number') feedback.rating = rating;
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: true, message: err.message || 'Failed to update feedback' });
  }
};

// Delete Feedback (Admin only)
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const fb = await Feedback.findByIdAndDelete(id);
    if (!fb) return res.status(404).json({ error: true, message: 'Feedback not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: true, message: err.message || 'Failed to delete feedback' });
  }
};

// Add Reply (Admin or User)
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, message, email } = req.body;
    const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ error: true, message: 'Feedback not found' });

    const reply = { sender, message };
    if (sender === "user" && email) reply.email = email;
    feedback.replies.push(reply);
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: true, message: err.message || 'Failed to add reply' });
  }
};

// Update a reply by id
export const updateReply = async (req, res) => {
  try {
  const { id, replyId } = req.params;
  const { message, requesterEmail, asAdmin } = req.body || {};
    const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ error: true, message: 'Feedback not found' });

    const reply = feedback.replies.id(replyId);
  if (!reply) return res.status(404).json({ error: true, message: 'Reply not found' });

    // If reply was created by a user, ensure requesterEmail matches the reply email
    if (reply.sender === 'user' && !asAdmin) {
      if (!requesterEmail || reply.email !== requesterEmail) {
  return res.status(403).json({ error: true, message: 'Not allowed to edit this reply' });
      }
    }

    if (typeof message === 'string' && message.trim()) reply.message = message.trim();
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: true, message: err.message || 'Failed to update reply' });
  }
};

// Delete a reply
export const deleteReply = async (req, res) => {
  try {
  const { id, replyId } = req.params;
  const { requesterEmail, asAdmin } = req.body || req.query || {};
    const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ error: true, message: 'Feedback not found' });

    const reply = feedback.replies.id(replyId);
  if (!reply) return res.status(404).json({ error: true, message: 'Reply not found' });

    if (reply.sender === 'user' && !asAdmin) {
      if (!requesterEmail || reply.email !== requesterEmail) {
  return res.status(403).json({ error: true, message: 'Not allowed to delete this reply' });
      }
    }

    // Some environments return plain objects for nested arrays; remove by filtering to be robust
    feedback.replies = feedback.replies.filter((r) => {
      const rid = (r._id && r._id.toString) ? r._id.toString() : (r.id || r._id);
      return rid !== String(replyId);
    });
    await feedback.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: true, message: err.message || 'Failed to delete reply' });
  }
};
