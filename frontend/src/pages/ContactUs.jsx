// src/pages/ContactUs.jsx
import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  Building,
  Users,
  Globe
} from 'lucide-react';

/** Full-bleed wrapper (escapes parent container gutters) */
function FullBleed({ className = "", children }) {
  return (
    <div className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen ${className}`}>
      {children}
    </div>
  );
}

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      setTimeout(() => setSubmitted(false), 3000);
    }, 2000);
  };

  const officeLocations = [
    {
      name: "Head Office - Colombo",
      address: "555, Galle Road, Colombo 03",
      phone: "+94 11 234 5678",
      email: "info@servsync.com",
      hours: "Mon-Fri: 8:30 AM - 5:00 PM",
      type: "head-office"
    },
    {
      name: "Branch Office - Kandy",
      address: "123, Peradeniya Road, Kandy",
      phone: "+94 81 223 4455",
      email: "kandy@servsync.com",
      hours: "Mon-Fri: 9:00 AM - 4:30 PM",
      type: "branch"
    },
    {
      name: "Branch Office - Galle",
      address: "456, Matara Road, Galle",
      phone: "+94 91 223 5566",
      email: "galle@servsync.com",
      hours: "Mon-Fri: 8:00 AM - 4:00 PM",
      type: "branch"
    }
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      value: "+94 1919",
      description: "24/7 Emergency Hotline",
      action: "tel:+941919",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Mail,
      title: "Email Us",
      value: "info@servsync.com",
      description: "Response within 24 hours",
      action: "mailto:info@servsync.com",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      value: "Available Now",
      description: "Mon-Fri 9AM-6PM",
      action: () => alert("Live chat feature coming soon!"),
      gradient: "from-purple-500 to-violet-600"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      value: "Find Location",
      description: "Multiple branches nationwide",
      action: () => document.getElementById('locations-section')?.scrollIntoView({ behavior: 'smooth' }),
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const socialLinks = [
    { icon: Facebook, url: "https://facebook.com/servsync", color: "hover:text-blue-600" },
    { icon: Twitter, url: "https://twitter.com/servsync", color: "hover:text-sky-500" },
    { icon: Instagram, url: "https://instagram.com/servsync", color: "hover:text-pink-600" },
    { icon: Linkedin, url: "https://linkedin.com/company/servsync", color: "hover:text-blue-700" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-800">
      <main className="flex-1 w-full pb-16">
        {/* Success Toast */}
        {submitted && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">Message sent successfully! We'll get back to you soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* HERO: edge to edge with inner padding */}
        <FullBleed>
          <Hero />
        </FullBleed>

        {/* CONTACT METHODS: edge to edge */}
        <FullBleed className="mt-4">
          <ContactMethods methods={contactMethods} />
        </FullBleed>

        {/* CONTACT FORM & OFFICE INFO: edge to edge */}
        <FullBleed className="mt-4">
          <ContactFormSection
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </FullBleed>

        {/* OFFICE LOCATIONS: edge to edge */}
        <FullBleed className="mt-4">
          <OfficeLocations locations={officeLocations} />
        </FullBleed>

        {/* FOOTER CTA: edge to edge */}
        <FullBleed className="mt-4">
          <FooterCTA socialLinks={socialLinks} />
        </FullBleed>
      </main>
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative w-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')`
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-purple-900/60 to-pink-900/40" />

      <div className="relative h-full w-full px-6 md:px-10 lg:px-16 py-20 flex flex-col justify-center text-center">
        <div className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 self-center">
          <MessageSquare className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Get In Touch</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-sm">
          Contact
          <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            Our Team
          </span>
        </h1>
        
        <p className="mt-3 text-white/90 max-w-2xl mx-auto">
          Have questions or need assistance? We're here to help. Reach out to us through any of the channels below.
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

/* ---------------- CONTACT METHODS ---------------- */
function ContactMethods({ methods }) {
  return (
    <section className="w-screen bg-white">
      <div className="px-6 md:px-10 lg:px-16 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Contact Methods</h2>
          <p className="text-lg text-slate-600">Choose the best way to reach us</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {methods.map((method, index) => (
            <button
              key={index}
              onClick={typeof method.action === 'function' ? method.action : () => window.location.href = method.action}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${method.gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <method.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{method.title}</h3>
              <p className="text-sm text-slate-600 mb-2">{method.description}</p>
              <p className="font-medium text-slate-900">{method.value}</p>

              <div className={`absolute inset-0 bg-gradient-to-r ${method.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CONTACT FORM SECTION ---------------- */
function ContactFormSection({ formData, handleInputChange, handleSubmit, isSubmitting }) {
  return (
    <section className="w-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="px-6 md:px-10 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div id="contact-form" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a Message</h2>
              <p className="text-slate-600">Fill out the form below and we'll get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Office Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Head Office</h3>
                  <p className="text-slate-600">Colombo 03</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Address</p>
                    <p className="text-slate-600">555, Galle Road, Colombo 03</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <p className="text-slate-600">+94 11 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-slate-600">info@servsync.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Business Hours</p>
                    <p className="text-slate-600">Mon-Fri: 8:30 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Find Us</h3>
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">Interactive Map</p>
                  <p className="text-sm text-slate-500">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- OFFICE LOCATIONS ---------------- */
function OfficeLocations({ locations }) {
  return (
    <section id="locations-section" className="w-screen bg-white">
      <div className="px-6 md:px-10 lg:px-16 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Locations</h2>
          <p className="text-lg text-slate-600">Visit any of our branches nationwide</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {locations.map((office, index) => (
            <div key={index} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  office.type === 'head-office'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}>
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{office.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    office.type === 'head-office'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {office.type === 'head-office' ? 'Head Office' : 'Branch'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <p className="text-sm text-slate-600">{office.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600">{office.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600">{office.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600">{office.hours}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `tel:${office.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </button>
                <button
                  onClick={() => window.location.href = `mailto:${office.email}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER CTA ---------------- */
function FooterCTA({ socialLinks }) {
  return (
    <section className="w-screen bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="px-6 md:px-10 lg:px-16 py-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Need Immediate Assistance?</h2>
        <p className="text-xl text-slate-300 mb-8">
          Our emergency hotline is available 24/7 for urgent matters
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => window.location.href = "tel:+941919"}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Phone className="h-5 w-5" />
            Call Emergency Line
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200"
          >
            <MessageSquare className="h-5 w-5" />
            Send Message
          </button>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-6">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white transition-colors duration-200 ${social.color}`}
            >
              <social.icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
