import React, { useState } from "react";
import Modal from "../components/Shared/Modal.jsx";
import ComplaintForm from "../components/Support/ComplaintForm.jsx";
import FeedbackList from "../components/Feedback/FeedbackList.jsx";
import FeedbackForm from "../components/Feedback/FeedbackForm.jsx";
import axios from "axios";
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Users,
  Zap,
  Shield,
  HeadphonesIcon,
  Calendar,
  MapPin,
  ExternalLink,
  Star,
  ArrowRight,
} from "lucide-react";

/** Full-bleed wrapper (escapes parent container gutters) */
function FullBleed({ className = "", children }) {
  return (
    <div className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen ${className}`}>
      {children}
    </div>
  );
}

export default function Support() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Feedback form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);

  // Check if user is logged in
  const isLoggedIn = () => {
    try {
      const userToken = localStorage.getItem("token");
      const userEmail = localStorage.getItem("email");
      return !!(userToken && userEmail);
    } catch {
      return false;
    }
  };

  const handleSubmitted = (payload) => {
    setOpen(false);
    setToast("Complaint submitted successfully! Check your profile to track the status.");
    setTimeout(() => setToast(""), 4000);
    console.log("Complaint saved:", payload);
  };

  // Handler to go back from FeedbackList to Support page
  const handleBackToSupport = () => {
    setShowFeedbackList(false);
  };

  // Handler to show feedback form (called from FeedbackList "Submit New Feedback" button)
  const handleShowFeedbackForm = () => {
    if (!isLoggedIn()) {
      setShowLoginPrompt(true);
      return;
    }
    setShowFeedbackList(false);
    setShowFeedbackForm(true);
  };

  // Handler to redirect to login
  const handleLoginRedirect = () => {
    setShowLoginPrompt(false);
    window.location.href = "/login";
  };

  // Handler to submit feedback
  const submitFeedback = async () => {
    if (!isLoggedIn()) {
      setShowLoginPrompt(true);
      return false;
    }

    try {
      const payload = {
        username: fullName,
        email,
        message,
        rating,
      };

      await axios.post("/api/feedback", payload);
      
      // Clear form
      setFullName("");
      setEmail("");
      setMessage("");
      setRating(0);
      
      // Show success toast
      setToast("Thank you! Your feedback has been submitted.");
      setTimeout(() => setToast(""), 4000);

      // Do not auto-redirect; let the form show a thank-you message instead
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setToast("Failed to submit feedback. Please try again.");
      setTimeout(() => setToast(""), 4000);
      return false;
    }
  };

  // Handler for FeedbackForm setView prop
  const handleSetView = (view) => {
    if (view === "list") {
      setShowFeedbackForm(false);
      setShowFeedbackList(true);
    }
  };

  // Handler to go back from FeedbackForm to FeedbackList
  const handleBackFromForm = () => {
    setShowFeedbackForm(false);
    setShowFeedbackList(true);
  };

  // If showing feedback form, render it instead of support page
  if (showFeedbackForm) {
    return (
      <FeedbackForm
        fullName={fullName}
        setFullName={setFullName}
        email={email}
        setEmail={setEmail}
        message={message}
        setMessage={setMessage}
        rating={rating}
        setRating={setRating}
        submitFeedback={submitFeedback}
        setView={handleSetView}
      />
    );
  }

  // If showing feedback list, render it instead of support page
  if (showFeedbackList) {
    return <FeedbackList onBack={handleShowFeedbackForm} />;
  }

  const faqs = [
    {
      id: 1,
      question: "How do I book an appointment?",
      answer: "You can book an appointment through our online portal by selecting your preferred branch, date, and time slot. You'll receive a confirmation email with your appointment details and QR code.",
      category: "booking"
    },
    {
      id: 2,
      question: "What documents do I need to bring?",
      answer: "Please bring your National ID, policy documents, and any relevant supporting documents. For claims, bring the claim form and supporting evidence.",
      category: "documents"
    },
    {
      id: 3,
      question: "How can I reschedule my appointment?",
      answer: "You can reschedule through your profile dashboard or contact our support team. Please provide at least 24 hours notice for rescheduling.",
      category: "booking"
    },
    {
      id: 4,
      question: "What should I do if I miss my appointment?",
      answer: "Contact us immediately if you miss your appointment. We can help reschedule and ensure you don't lose your place in the queue.",
      category: "booking"
    },
    {
      id: 5,
      question: "How long does claim processing take?",
      answer: "Standard claims are processed within 7-14 business days. Complex claims may take longer. You'll receive regular updates via email.",
      category: "claims"
    },
    {
      id: 6,
      question: "Can I track my complaint status?",
      answer: "Yes, you can track your complaint status through your profile dashboard. You'll also receive email notifications for any updates.",
      category: "support"
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickActions = [
    {
      title: "Submit Complaint",
      description: "Report an issue ",
      icon: MessageSquare,
      action: () => setOpen(true),
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      title: "View Feedback",
      description: "Browse customer feedback and discussions",
      icon: Star,
      action: () => setShowFeedbackList(true),
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Track Status",
      description: "Check your complaint or appointment status",
      icon: Search,
      action: () => window.location.href = "/complaintshistory",
      gradient: "from-purple-500 to-violet-600",
      bgGradient: "from-purple-50 to-violet-50"
    },
    {
      title: "Contact Support",
      description: "Speak with our support team directly",
      icon: Phone,
      action: () => window.location.href = "tel:+94123456789",
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50"
    }
  ];

  const contactMethods = [
    {
      title: "Phone Support",
      description: "Call our 24/7 helpline",
      icon: Phone,
      value: "+94 11 234 5678",
      action: "tel:+94112345678",
      availability: "24/7 Available",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Email Support",
      description: "Send us an email anytime",
      icon: Mail,
      value: "support@servsync.com",
      action: "mailto:support@servsync.com",
      availability: "Response within 24h",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team",
      icon: MessageSquare,
      value: "Available Now",
      action: () => alert("Live chat feature coming soon!"),
      availability: "Mon-Fri 9AM-6PM",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      title: "Visit Office",
      description: "Visit our main branch",
      icon: MapPin,
      value: "123 Main St, Colombo",
      action: () => window.open("https://maps.google.com", "_blank"),
      availability: "Mon-Fri 9AM-5PM",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-800">
      <main className="flex-1 w-full pb-16">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">{toast}</p>
              </div>
            </div>
          </div>
        )}

        {/* HERO: edge to edge with inner padding */}
        <FullBleed>
          <Hero onComplaintClick={() => setOpen(true)} />
        </FullBleed>

        {/* QUICK ACTIONS: edge to edge */}
        <FullBleed className="mt-4">
          <QuickActions actions={quickActions} />
        </FullBleed>

        {/* FAQ SECTION: edge to edge */}
        <FullBleed className="mt-4">
          <FAQSection 
            faqs={filteredFAQs}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedFAQ={expandedFAQ}
            setExpandedFAQ={setExpandedFAQ}
          />
        </FullBleed>

        {/* CONTACT METHODS: edge to edge */}
        <FullBleed className="mt-4">
          <ContactMethods methods={contactMethods} />
        </FullBleed>

        {/* STATUS OVERVIEW: edge to edge */}
        <FullBleed className="mt-4">
          <StatusOverview />
        </FullBleed>
      </main>

        {/* Complaint Modal */}
        <Modal open={open} onClose={() => setOpen(false)} title="Submit a Complaint">
          <ComplaintForm
            onSubmit={handleSubmitted}
            onCancel={() => setOpen(false)}
          />
        </Modal>

        {/* Login Prompt Modal */}
        <Modal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} title="Login Required">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-6">
              You need to be logged in to submit feedback. Please log in to your account to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleLoginRedirect}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg transition-all duration-200"
              >
                Go to Login
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }/* ---------------- HERO ---------------- */
function Hero({ onComplaintClick }) {
  return (
    <section className="relative w-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-purple-900/60 to-pink-900/40" />

      <div className="relative h-full w-full px-6 md:px-10 lg:px-16 py-20 flex flex-col justify-center text-center">
        <div className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 self-center">
          <HeadphonesIcon className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">24/7 Support Available</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-sm">
          How can we
          <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            help you today?
          </span>
        </h1>
        
        <p className="mt-3 text-white/90 max-w-2xl mx-auto">
          Get instant support, submit complaints, or find answers to your questions.
          Our team is here to ensure your experience is smooth and satisfactory.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
        
        </div>
      </div>

      <svg
        className="absolute -bottom-px left-0 w-full"
        viewBox="0 0 1440 110"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M0,64 C240,120 480,8 720,24 C960,40 1200,128 1440,88 L1440,110 L0,110 Z" fill="#ffffff" />
      </svg>
    </section>
  );
}

/* ---------------- QUICK ACTIONS ---------------- */
function QuickActions({ actions }) {
  return (
    <section className="w-screen bg-white">
      <div className="px-6 md:px-10 lg:px-16 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <p className="text-lg text-slate-600">Common tasks and support options at your fingertips</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`group relative overflow-hidden bg-gradient-to-br ${action.bgGradient} border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{action.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{action.description}</p>

              <div className="flex items-center text-sm font-medium text-slate-700 group-hover:text-slate-900">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ SECTION ---------------- */
function FAQSection({ faqs, searchQuery, setSearchQuery, expandedFAQ, setExpandedFAQ }) {
  return (
    <section id="faq-section" className="w-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="px-6 md:px-10 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600">Find quick answers to common questions</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs..."
                className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">{faq.question}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {faq.category}
                      </span>
                    </div>
                  </div>

                  {expandedFAQ === faq.id ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-4 border-t border-slate-100">
                    <p className="text-slate-600 pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {faqs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No FAQs found</h3>
              <p className="text-slate-600">Try adjusting your search terms or contact our support team.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CONTACT METHODS ---------------- */
function ContactMethods({ methods }) {
  return (
    <section className="w-screen bg-white">
      <div className="px-6 md:px-10 lg:px-16 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Contact Us</h2>
          <p className="text-lg text-slate-600">Multiple ways to reach our support team</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {methods.map((method, index) => (
            <div
              key={index}
              className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${method.gradient} rounded-xl mb-4`}>
                <method.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{method.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{method.description}</p>

              <div className="space-y-2">
                <p className="font-medium text-slate-900">{method.value}</p>
                <p className="text-xs text-green-600 font-medium">{method.availability}</p>
              </div>

              <button
                onClick={() => {
                  if (typeof method.action === 'string') {
                    if (method.action.startsWith('http')) {
                      window.open(method.action, '_blank');
                    } else if (method.action.startsWith('mailto:')) {
                      window.location.href = method.action;
                    } else if (method.action.startsWith('tel:')) {
                      window.location.href = method.action;
                    }
                  } else {
                    method.action();
                  }
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-all duration-200"
              >
                <span>Contact</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- STATUS OVERVIEW ---------------- */
function StatusOverview() {
  return (
    <section className="w-screen bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="px-6 md:px-10 lg:px-16 py-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-8">Support Status</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl mb-4 mx-auto">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">System Status</h3>
            <p className="text-green-300 font-medium">All Systems Operational</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mb-4 mx-auto">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
            <p className="text-blue-300 font-medium">Average: 2 hours</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-xl mb-4 mx-auto">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Satisfaction</h3>
            <p className="text-purple-300 font-medium">4.8/5 Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
