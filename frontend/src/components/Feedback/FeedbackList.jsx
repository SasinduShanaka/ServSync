import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  Star,
  Send,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  User,
  MessageSquare,
  Clock,
  Shield,
  Heart,
  ThumbsUp,
  Reply,
  MoreVertical,
  Edit3,
  Calendar,
  Users,
} from "lucide-react";

// Custom styles for animations and scrollbar
const customStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
  
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  
  .glass-morphism {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.8);
  }
`;

// Helper function for time formatting
const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// ----- UI Helper Components -----
const Stars = ({ value = 0, size = "small", interactive = false }) => {
  const starSize = size === "large" ? "h-6 w-6" : "h-4 w-4";
  const colors = [
    "text-red-500", // 1 star
    "text-orange-500", // 2 stars  
    "text-yellow-500", // 3 stars
    "text-blue-500", // 4 stars
    "text-green-500", // 5 stars
  ];
  const colorClass = colors[Math.ceil(value) - 1] || "text-gray-400";
  
  return (
    <div className={`flex items-center gap-1 ${colorClass}`} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={`${starSize} transition-all duration-200 ${
            i < value 
              ? "fill-current drop-shadow-sm" 
              : "opacity-30"
          } ${interactive ? "hover:scale-110 cursor-pointer" : ""}`} 
        />
      ))}
      <span className="ml-2 text-sm font-semibold">
        {value > 0 ? `${value}/5` : "No rating"}
      </span>
    </div>
  );
};

const UserAvatar = ({ name, email, isAdmin = false }) => {
  const initials = (name || email || "A").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500", 
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
  ];
  const colorClass = colors[email?.length % colors.length || 0];
  
  return (
    <div className="relative">
      <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-white`}>
        {initials}
      </div>
      {isAdmin && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <Shield className="h-3 w-3 text-white" />
        </div>
      )}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white pulse-animation"></div>
    </div>
  );
};

// Separated to keep component identity stable across renders and avoid remounts
const FeedbackCard = React.memo(function FeedbackCard({
  fb,
  myEmail,
  editing = {},
  setEditing,
  replyEditing = {},
  setReplyEditing,
  startEdit,
  deleteFeedback,
  startEditReply,
  deleteReply,
  saveEditReply,
  cancelEditReply,
  saveEdit,
  cancelEdit,
  handleReplyTextChange,
  submitReply,
  replyTexts = {},
}) {
  const fid = fb._id || fb.id;
  const isOwner = myEmail && fb.email === myEmail;
  const editData = editing[fid];
  const createdAt = fb.createdAt ? new Date(fb.createdAt) : null;
  const timeAgo = createdAt ? formatTimeAgo(createdAt) : "";
  const repliesCount = fb.replies?.length || 0;

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-xl hover:border-gray-300/80 transition-all duration-300 hover:-translate-y-1 overflow-hidden fade-in-up">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <UserAvatar 
              name={fb.username || fb.fullName} 
              email={fb.email}
              isAdmin={false}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 text-lg truncate">
                  {fb.username || fb.fullName || "Anonymous User"}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  <Users size={10} />
                  Customer
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-blue-500" />
                  <span className="font-medium">{fb.email || "No email provided"}</span>
                </div>
                {createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-green-500" />
                    <span>{timeAgo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {typeof fb.rating === "number" && (
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <Stars value={fb.rating || 0} size="small" />
              </div>
            )}
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {editData ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Edit Your Feedback</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={4}
                value={editData.message}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, [fid]: { ...((s && s[fid]) || {}), message: e.target.value } }))
                }
                placeholder="Share your thoughts..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Update Rating:</span>
                <select
                  className="rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editData.rating}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, [fid]: { ...((s && s[fid]) || {}), rating: Number(e.target.value) } }))
                  }
                >
                  <option value={0}>Keep current rating</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Star{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200"
                onClick={() => saveEdit(fid)}
              >
                <Pencil className="h-4 w-4" />
                Save Changes
              </button>
              <button
                className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold transition-colors"
                onClick={() => cancelEdit(fid)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">Customer Feedback</h4>
                <blockquote className="text-gray-700 leading-relaxed bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-l-4 border-blue-500 italic">
                  "{fb.message}"
                </blockquote>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-white rounded-xl border border-gray-100">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Replies</span>
                  <span className="font-bold text-blue-600">{repliesCount}</span>
                </div>
                {repliesCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-600 font-semibold">Active Discussion</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {createdAt && createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}

        {/* Owner Controls */}
        {isOwner && !editData && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors" 
              onClick={() => startEdit(fb)}
            >
              <Edit3 className="h-4 w-4" /> Edit Feedback
            </button>
            <button 
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors" 
              onClick={() => deleteFeedback(fid)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Replies Section */}
      {repliesCount > 0 && (
        <div className="px-6 pb-2">
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Reply className="h-4 w-4 text-indigo-500" />
              <h4 className="font-semibold text-gray-800">Conversation Thread</h4>
              <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
              </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {fb.replies.map((r) => {
                const rid = r._id || r.id;
                  const isTemp = r._temp || (typeof rid === 'string' && rid.startsWith('temp-'));
                  const canEdit = r.sender === "user" && myEmail && r.email === myEmail && !isTemp && !!rid;
                const isAdmin = r.sender === "admin";
                
                return (
                  <div key={rid} className={`group/reply rounded-xl p-3 border transition-all duration-200 ${
                    isAdmin 
                      ? "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200" 
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-start gap-3">
                      <UserAvatar 
                        name={isAdmin ? "Admin" : "User"} 
                        email={r.email}
                        isAdmin={isAdmin}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${
                              isAdmin ? "text-indigo-700" : "text-gray-700"
                            }`}>
                              {isAdmin ? "Support Team" : "Customer"}
                            </span>
                            {r.email && (
                              <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                                {r.email}
                              </span>
                            )}
                          </div>
                          {canEdit && !replyEditing[rid] && (
                            <div className="flex gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-all" 
                                onClick={() => startEditReply(fid, r)}
                              >
                                <Edit3 size={12} />
                              </button>
                              <button 
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-all" 
                                onClick={() => deleteReply(fid, rid)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {replyEditing[rid] ? (
                          <div className="space-y-3">
                            <textarea
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={2}
                              value={replyEditing[rid].message}
                                onChange={(e) =>
                                  setReplyEditing((s) => ({ ...s, [rid]: { ...((s && s[rid]) || {}), message: e.target.value } }))
                                }
                            />
                            <div className="flex gap-2">
                              <button 
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium" 
                                onClick={() => saveEditReply(rid)}
                              >
                                Save
                              </button>
                              <button 
                                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm" 
                                onClick={() => cancelEditReply(rid)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-sm leading-relaxed">{r.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reply Input */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50/30 to-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <UserAvatar name="You" email={myEmail} />
          <div className="flex-1">
            <input
              type="text"
              value={(replyTexts && replyTexts[fid]) || ""}
              onChange={(e) => handleReplyTextChange(fid, e.target.value)}
              placeholder="Join the conversation..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitReply(fid);
                }
              }}
            />
          </div>
          <button
            onClick={() => submitReply(fid)}
            disabled={!((((replyTexts && replyTexts[fid]) || "").trim()))}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <span>Press Enter to send</span>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <span>Be respectful and constructive</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Modern, clean FeedbackList
 * - Premium design with real-world professional look
 * - Enhanced user experience with animations and interactions
 * - Responsive design that works on all devices
 */
export default function FeedbackList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyTexts, setReplyTexts] = useState({});
  const [editing, setEditing] = useState({});
  const [replyEditing, setReplyEditing] = useState({});

  // Logged-in email (used to allow user to edit/delete their own entries)
  const myEmail = useMemo(() => {
    try {
      return localStorage.getItem("feedbackEmail") || "";
    } catch {
      return "";
    }
  }, []); // Add empty dependency array to prevent re-computation

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("/api/feedback");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setItems(list);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Remove refreshKey dependency to prevent auto-refresh

  // Update local state instead of full refresh
  const updateFeedbackInState = (feedbackId, updatedFeedback) => {
    setItems(prevItems => 
      prevItems.map(item => 
        (item._id || item.id) === feedbackId ? { ...item, ...updatedFeedback } : item
      )
    );
  };

  const addReplyToState = (feedbackId, newReply) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if ((item._id || item.id) === feedbackId) {
          return {
            ...item,
            replies: [...(item.replies || []), newReply]
          };
        }
        return item;
      })
    );
  };

  const updateReplyInState = (feedbackId, replyId, updatedReply) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if ((item._id || item.id) === feedbackId) {
          return {
            ...item,
            replies: (item.replies || []).map(reply => 
              (reply._id || reply.id) === replyId ? { ...reply, ...updatedReply } : reply
            )
          };
        }
        return item;
      })
    );
  };

  const removeReplyFromState = (feedbackId, replyId) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if ((item._id || item.id) === feedbackId) {
          return {
            ...item,
            replies: (item.replies || []).filter(reply => (reply._id || reply.id) !== replyId)
          };
        }
        return item;
      })
    );
  };

  const removeFeedbackFromState = (feedbackId) => {
    setItems(prevItems => prevItems.filter(item => (item._id || item.id) !== feedbackId));
  };

  // Optimized callbacks to prevent re-renders
  const handleReplyTextChange = useCallback((feedbackId, value) => {
    setReplyTexts((r) => ({ ...r, [feedbackId]: value }));
  }, []);

  // ----- Actions: replies -----
  const submitReply = async (feedbackId) => {
    const content = replyTexts[feedbackId]?.trim();
    if (!content) return;
    try {
      const response = await axios.post(`/api/feedback/${feedbackId}/reply`, {
        sender: "user",
        message: content,
        email: myEmail || undefined,
      });

      // Backend returns the full feedback document; prefer replacing replies from server
      const serverFb = response?.data?.data || response?.data;
      if (serverFb && Array.isArray(serverFb.replies)) {
        updateFeedbackInState(feedbackId, { replies: serverFb.replies });
      } else {
        // Fallback: add a temporary reply but mark it non-editable
        const tempReply = {
          _id: `temp-${Date.now()}`,
          message: content,
          sender: "user",
          email: myEmail,
          createdAt: new Date().toISOString(),
          _temp: true,
        };
        addReplyToState(feedbackId, tempReply);
      }
      setReplyTexts((r) => ({ ...r, [feedbackId]: "" }));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to submit reply");
    }
  };

  const startEditReply = (feedbackId, reply) => {
    const rid = reply._id || reply.id;
    setReplyEditing((s) => ({ ...s, [rid]: { feedbackId, message: reply.message || "" } }));
  };

  const cancelEditReply = (replyId) => {
    setReplyEditing((s) => {
      const copy = { ...s };
      delete copy[replyId];
      return copy;
    });
  };

  const saveEditReply = async (replyId) => {
    const edit = replyEditing[replyId];
    if (!edit) return;
    const msg = (edit.message || "").trim();
    if (!msg) return alert("Reply message cannot be empty");
    try {
      const resp = await axios.put(`/api/feedback/${edit.feedbackId}/reply/${replyId}`, {
        message: msg,
        requesterEmail: myEmail || undefined,
      });

      // Prefer server replies (backend returns full feedback)
      const serverFb = resp?.data?.data || resp?.data;
      if (serverFb && Array.isArray(serverFb.replies)) {
        updateFeedbackInState(edit.feedbackId, { replies: serverFb.replies });
      } else {
        updateReplyInState(edit.feedbackId, replyId, { message: msg });
      }
      cancelEditReply(replyId);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Failed to save reply");
    }
  };

  const deleteReply = async (feedbackId, replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await axios.delete(`/api/feedback/${feedbackId}/reply/${replyId}`, {
        data: { requesterEmail: myEmail || undefined },
      });
      
      // Remove the reply from state without refreshing
      removeReplyFromState(feedbackId, replyId);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Failed to delete reply");
    }
  };

  // ----- Actions: feedback -----
  const startEdit = (fb) => {
    const fid = fb._id || fb.id;
    setEditing((e) => ({ ...e, [fid]: { message: fb.message || "", rating: fb.rating || 0 } }));
  };

  const cancelEdit = (id) => {
    setEditing((e) => {
      const copy = { ...e };
      delete copy[id];
      return copy;
    });
  };

  const saveEdit = async (id) => {
    const data = editing[id];
    if (!data || !data.message?.trim()) return;
    try {
      const payload = { message: data.message.trim() };
      if (data.rating && data.rating >= 1 && data.rating <= 5) payload.rating = data.rating;
      await axios.put(`/api/feedback/${id}`, payload);
      
      // Update the feedback in state without refreshing
      updateFeedbackInState(id, payload);
      cancelEdit(id);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Failed to update feedback");
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await axios.delete(`/api/feedback/${id}`);
      
      // Remove the feedback from state without refreshing
      removeFeedbackFromState(id);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Failed to delete feedback");
    }
  };

  // ----- UI helpers -----
  // (moved helpers and FeedbackCard to top-level to prevent remounts)

  const Skeleton = () => (
    <div className="animate-pulse bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
      <div className="mt-6 h-12 w-full bg-gray-200 rounded" />
    </div>
  );

  // ----- Rendering -----
  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Loading Feedback</h1>
                  <p className="text-gray-600">Fetching customer insights...</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Feedback</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg transition-all duration-200"
              >
                <Loader2 className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Modern Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white pulse-animation"></div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Customer Feedback
                </h1>
                <p className="text-gray-600 font-medium">Join the conversation and share your thoughts</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                    <div className="text-sm text-gray-600">Total Feedback</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Reply className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {items.reduce((sum, item) => sum + (item.replies?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Replies</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {items.length > 0 
                        ? (items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length).toFixed(1)
                        : "0.0"
                      }
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Be the first to share your thoughts and start the conversation. Your feedback helps us improve!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((fb) => (
                <FeedbackCard
                  key={fb._id || fb.id}
                  fb={fb}
                  myEmail={myEmail}
                  editing={editing}
                  setEditing={setEditing}
                  replyEditing={replyEditing}
                  setReplyEditing={setReplyEditing}
                  startEdit={startEdit}
                  deleteFeedback={deleteFeedback}
                  startEditReply={startEditReply}
                  deleteReply={deleteReply}
                  saveEditReply={saveEditReply}
                  cancelEditReply={cancelEditReply}
                  saveEdit={saveEdit}
                  cancelEdit={cancelEdit}
                  handleReplyTextChange={handleReplyTextChange}
                  submitReply={submitReply}
                  replyTexts={replyTexts}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}