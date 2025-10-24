import Complaint from "../models/Complaint.model.js";
import Customer from "../models/Customer.model.js";

// Create a new complaint
export const createComplaint = async (req, res) => {
  try {
    // Body has been validated & sanitized by Joi middleware
    const { name, email, phone, branch, category, description, attachment } = req.body;

    let customer = await Customer.findOne({ email });
    if (!customer) {
      customer = await Customer.create({ name, email, phone, branch });
    }

    const complaintData = {
      customer: customer._id,
      category,
      description,
      branch,
      logs: [{ actor: "system", action: "created" }]
    };

    // Add attachment if provided
    if (attachment && attachment.fileName) {
      complaintData.attachment = {
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        size: attachment.size,
        mimetype: attachment.mimetype,
        uploadedAt: new Date()
      };
    }

    const complaint = await Complaint.create(complaintData);

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Get complaint by Mongo _id
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('customer');
    if (!complaint) return res.status(404).json({ error: true, message: "Complaint not found" });
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Update complaint status and response
export const updateComplaintStatus = async (req, res) => {
  try {
    let { status, responseNotes } = req.body; // already validated
    const allowedStatuses = ["pending", "in-progress", "resolved", "escalated"];
    if (typeof status === 'string') {
      status = status.trim().toLowerCase().replace(/\s+/g, '-');
    }
    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ error: true, message: "Invalid status" });

    const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ error: true, message: "Complaint not found" });

    if (status) complaint.status = status;
    if (responseNotes) complaint.responseNotes = responseNotes;
    complaint.updatedAt = new Date();

  const actor = req.session?.staffNic || req.session?.nic || 'system';
    complaint.logs.push({ actor, action: "updated", note: responseNotes });

    await complaint.save();
    res.json({ success: true, complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Get all complaints
export const getAllComplaints = async (req, res) => {
  try {
    const { email } = req.query || {};
    if (email) {
      const customer = await Customer.findOne({ email });
      if (!customer) return res.json([]);
      const complaints = await Complaint.find({ customer: customer._id }).populate('customer').sort({ createdAt: -1 });
      return res.json(complaints);
    }

    const complaints = await Complaint.find().populate('customer').sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Get complaint by referenceId
export const getComplaintByReferenceId = async (req, res) => {
  try {
    const { referenceId } = req.params;
    const complaint = await Complaint.findOne({ referenceId }).populate('customer');
    if (!complaint) return res.status(404).json({ error: true, message: "Complaint not found" });
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Public update
export const updateComplaintPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, category, description } = req.body || {};
  if (!email) return res.status(400).json({ error: true, message: "Email is required" });

    const complaint = await Complaint.findById(id).populate('customer');
  if (!complaint) return res.status(404).json({ error: true, message: "Complaint not found" });
    if (!complaint.customer || complaint.customer.email !== email) {
  return res.status(403).json({ error: true, message: "Not allowed to edit this complaint" });
    }

    if (category?.trim()) complaint.category = category.trim();
    if (description?.trim()) complaint.description = description.trim();

    complaint.updatedAt = new Date();
    complaint.logs.push({ actor: email, action: "user-updated" });

    await complaint.save();
    res.json({ success: true, complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Public delete
export const deleteComplaintPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.body?.email || req.query?.email;

    const complaint = await Complaint.findById(id).populate('customer');
    if (!complaint) return res.status(404).json({ error: true, message: "Complaint not found" });
    if (email && (!complaint.customer || complaint.customer.email !== email)) {
      return res.status(403).json({ error: true, message: "Not allowed to delete this complaint" });
    }

    await Complaint.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// Analytics endpoint
export const getComplaintAnalytics = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('customer');
    
    // Basic statistics
    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
    const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
    const escalatedComplaints = complaints.filter(c => c.status === 'escalated').length;
    
    // Status distribution
    const statusCounts = complaints.reduce((acc, c) => {
      const status = c.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Category distribution
    const categoryCounts = complaints.reduce((acc, c) => {
      const category = c.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Branch distribution
    const branchCounts = complaints.reduce((acc, c) => {
      const branch = c.branch || c.customer?.branch || 'Unknown';
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {});
    
    // Monthly trend (last 12 months)
    const monthlyTrend = {};
    const now = new Date();
    
    complaints.forEach(c => {
      if (c.createdAt) {
        const date = new Date(c.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1;
      }
    });
    
    // Calculate average resolution time
    const resolvedWithDates = complaints.filter(c => 
      c.status === 'resolved' && c.createdAt && c.updatedAt
    );
    
    let avgResolutionHours = 0;
    if (resolvedWithDates.length > 0) {
      const totalHours = resolvedWithDates.reduce((sum, c) => {
        const created = new Date(c.createdAt);
        const updated = new Date(c.updatedAt);
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = totalHours / resolvedWithDates.length;
    }
    
    // Response statistics
    const responseStats = {
      withResponse: complaints.filter(c => c.responseNotes && c.responseNotes.trim()).length,
      withoutResponse: complaints.filter(c => !c.responseNotes || !c.responseNotes.trim()).length
    };
    
    const analytics = {
      summary: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        escalatedComplaints,
        resolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0,
        avgResolutionTime: avgResolutionHours > 0 ? (avgResolutionHours / 24).toFixed(1) : 0 // in days
      },
      distributions: {
        status: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        category: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
        branch: Object.entries(branchCounts).map(([name, value]) => ({ name, value }))
      },
      trends: {
        monthly: Object.entries(monthlyTrend)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }))
      },
      responseStats,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: true, message: "Server error" });
  }
};
