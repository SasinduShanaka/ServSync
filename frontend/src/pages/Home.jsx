// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Search, CalendarDays, Info, ArrowRight,
  ShieldCheck, CarFront, Building2, Repeat2, AlertTriangle,
  FileCheck2, ClipboardList, UserPlus2, FileText,
  Facebook, Instagram, Youtube, Linkedin
} from "lucide-react";

/** Full-bleed wrapper (escapes parent container gutters) */
function FullBleed({ className = "", children }) {
  return (
    <div className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-800">
      <main className="flex-1 w-full pb-16">
        {/* HERO: edge to edge with inner padding */}
        <FullBleed>
          <Hero />
        </FullBleed>

        {/* SERVICES strip: edge to edge */}
        <FullBleed className="mt-0">
          <Services />
        </FullBleed>

        {/* SEARCH bar: edge to edge */}
        <FullBleed className="mt-4">
          <SearchBar />
        </FullBleed>

        {/* QUICK ACCESS grid: edge to edge */}
        <FullBleed className="mt-4">
          <QuickAccess />
        </FullBleed>
      </main>

      <FullBleed>
        <Footer />
      </FullBleed>
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  const heroImages = [
   
    "https://www.reliancegeneral.co.in/siteassets/rgiclassets/images/blogs-images/what-is-health-insurance-a-comprehensive-guide-for-beginners2.webp",
    
    "https://insurance.phonepe.com/static/b9255dbb33d672b33828a697b2a55f45/836bc/basics_of_health_insurance_blog.webp",

    "https://www.renewbuy.com/sites/default/files/2023-08/Motor%20Insurance%20%282%29.png",

  ];
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 7000); // change slide every 7s
    return () => clearInterval(id);
  }, [heroImages.length]);

  return (
    <section className="relative w-screen overflow-hidden">
  {heroImages.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-[1200ms] bg-cover bg-center ${
            idx === current ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${img})` }}
          aria-hidden={idx !== current}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-black/0" />

      <div className="relative h-full w-full px-6 md:px-10 lg:px-16 py-20 flex flex-col justify-end">
        <p className="text-white/80 text-sm">National Insurance Trust Fund</p>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-sm">
          Book NITF service appointments
        </h1>
        <p className="mt-3 text-white/90 max-w-2xl">
          Choose a service, select your branch, pick a time. Get instant confirmation and a QR for quick check‑in.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/appointment"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Book an appointment <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur text-white px-6 py-3 ring-2 ring-white/30 hover:bg-white/20 font-semibold transition-all hover:-translate-y-0.5"
          >
            Explore services
          </Link>
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

      <div className="hidden lg:flex absolute right-0 top-0 w-1/3 h-full p-4 md:p-6 flex-col gap-4">
        <PromoCard
          title="Member Benefits (Agrahara)"
          subtitle="See medical benefits & schemes"
          icon={<ShieldCheck className="h-6 w-6" />}
          to="/tools/benefits"
        />
        <PromoCard
          title="Check Claim Status"
          subtitle="Track your claims & membership"
          icon={<FileCheck2 className="h-6 w-6" />}
          to="/tools/claims-status"
        />
      </div>
    </section>
  );
}

function PromoCard({ title, subtitle, icon, to = "#" }) {
  return (
    <Link
      to={to}
      className="group border-2 border-white hover:border-blue-300 bg-gradient-to-br from-white to-blue-50 backdrop-blur p-4 flex items-center gap-4 transition shadow-lg hover:shadow-xl rounded-xl transform hover:-translate-y-1"
    >
      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white grid place-items-center shadow-md">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-700" />
    </Link>
  );
}

/* ---------------- SERVICES ---------------- */
function Services() {
  const services = [
    { title: "Agrahara", tagline: "Medical insurance scheme for public officers & their families.", to: "/services/agrahara", icon: <ShieldCheck className="h-7 w-7" />, gradient: "from-blue-500 to-cyan-500", bgGradient: "from-blue-50 to-cyan-50" },
    { title: "Motor Insurance", tagline: "Financial risk management for vehicles owned by public servants.", to: "/services/motor", icon: <CarFront className="h-7 w-7" />, gradient: "from-emerald-500 to-teal-500", bgGradient: "from-emerald-50 to-teal-50" },
    { title: "Non-Motor Insurance", tagline: "Risk cover for fire, marine and miscellaneous lines.", to: "/services/non-motor", icon: <Building2 className="h-7 w-7" />, gradient: "from-purple-500 to-pink-500", bgGradient: "from-purple-50 to-pink-50" },
    { title: "Reinsurance", tagline: "National reinsurer: treaty & facultative; catastrophic risk support.", to: "/services/reinsurance", icon: <Repeat2 className="h-7 w-7" />, gradient: "from-orange-500 to-amber-500", bgGradient: "from-orange-50 to-amber-50" },
    { title: "SRCC & TC", tagline: "Cover for strike, riot, civil commotion & terrorism risks.", to: "/services/srcc-tc", icon: <AlertTriangle className="h-7 w-7" />, gradient: "from-rose-500 to-red-500", bgGradient: "from-rose-50 to-red-50" },
  ];

  return (
    <section className="w-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 px-6 md:px-10 lg:px-16 py-6">
  {services.map((s) => (
        <Link
          key={s.title}
          to={s.to}
          className={`relative overflow-hidden bg-gradient-to-br ${s.bgGradient} p-6 transition border-2 border-white hover:border-${s.gradient.split('-')[1]}-300 rounded-2xl shadow-lg hover:shadow-xl group hover:-translate-y-2`}
        >
          <div className="relative flex flex-col items-start gap-4">
            <div className={`h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br ${s.gradient} text-white grid place-items-center shadow-md`}>
              {s.icon}
            </div>
            <div>
              <p className="text-slate-900 font-bold text-lg">{s.title}</p>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{s.tagline}</p>
            </div>
          </div>
        </Link>
      ))}
      </div>
    </section>
  );
}

/* ---------------- SEARCH ---------------- */
function SearchBar() {
  return (
    <section className="w-screen">
      <div className="px-6 md:px-10 lg:px-16 py-6 md:py-8">
        <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur rounded-3xl shadow-2xl border-2 border-white p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Find Your Appointment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <FormField label="Service">
              <select className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all shadow-sm">
                <option>Select Service</option>
                <option>Agrahara</option><option>Motor</option>
                <option>Non-Motor</option><option>Reinsurance</option><option>SRCC & TC</option>
              </select>
            </FormField>
            <FormField label="Branch">
              <select className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all shadow-sm">
                <option>Select Branch</option>
                <option>NITF Colombo</option><option>NITF Kandy</option><option>NITF Galle</option>
              </select>
            </FormField>
            <FormField label="Date">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-3.5 h-5 w-5 text-pink-400" />
                <input
                  type="date"
                  className="w-full border-2 border-pink-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 transition-all shadow-sm"
                />
              </div>
            </FormField>
            <div className="flex justify-end">
              <button
                aria-label="Search appointments"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Search className="h-5 w-5" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

/* ---------------- QUICK ACCESS ---------------- */
function QuickAccess() {
  const items = [
    { title: "Benefits", desc: "Agrahara medical schemes & entitlements.", icon: ShieldCheck, to: "/tools/benefits", gradient: "from-cyan-500 to-blue-500", bgGradient: "from-cyan-50 to-blue-50" },
    { title: "Claims status", desc: "Check claim status & membership details.", icon: FileCheck2, to: "/tools/claims-status", gradient: "from-emerald-500 to-teal-500", bgGradient: "from-emerald-50 to-teal-50" },
    { title: "Check List", desc: "Guidelines for forms & claim payments.", icon: ClipboardList, to: "/tools/check-list", gradient: "from-violet-500 to-purple-500", bgGradient: "from-violet-50 to-purple-50" },
    { title: "Member registration", desc: "Register online for Agrahara membership.", icon: UserPlus2, to: "/tools/member-registration", badge: "New", gradient: "from-fuchsia-500 to-pink-500", bgGradient: "from-fuchsia-50 to-pink-50" },
    { title: "Forms & Downloads", desc: "All claim forms in one place.", icon: FileText, to: "/resources/forms", gradient: "from-orange-500 to-amber-500", bgGradient: "from-orange-50 to-amber-50" },
  ];

  return (
    <section className="w-screen">
      <div className="px-6 md:px-10 lg:px-16 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Quick Access</h2>
        <button className="text-sm text-blue-700 hover:underline flex items-center gap-1 font-semibold">
          Advanced search <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 md:px-10 lg:px-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        {items.map((it) => (
          <QuickCard key={it.title} {...it} />
        ))}
      </div>
    </section>
  );
}
function QuickCard({ title, desc, icon, to = "#", badge, gradient, bgGradient }) {
  const Icon = icon;
  return (
    <Link
      to={to}
      className={`group relative bg-gradient-to-br ${bgGradient} p-6 border-2 border-white hover:border-${gradient.split('-')[1]}-300 transition rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2`}
    >
      {badge && (
        <span className="absolute right-3 top-3 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md font-semibold">{badge}</span>
      )}
      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} text-white grid place-items-center shadow-md mb-4`}>
        <Icon className="h-8 w-8" />
      </div>
      <div className="flex-1">
        <div className="text-slate-900 font-bold text-lg leading-tight mb-2">{title}</div>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
      <Info className="absolute bottom-4 right-4 h-5 w-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
    </Link>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer className="bg-[#0a58a6] text-white mt-8 w-full">
      {/* Centered inner container to align with page content while footer remains full-bleed */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-16 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-white/10 grid place-items-center font-bold">S</div>
            <div className="text-lg font-semibold">ServSync · NITF</div>
          </div>
          <div className="mt-4 space-y-2 text-white/90">
            <p>+94 11 2 123 456</p>
            <p>info@nitf.lk</p>
            <p>National Insurance Trust Fund, Colombo, Sri Lanka.</p>
          </div>
        </div>
        <FooterList title="Other" items={["Terms and Conditions", "FAQ", "Feedback", "Privacy Policy"]} />
        <FooterList title="About" items={["The Company", "Investor Relations", "Partners", "Awards", "Careers"]} />
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-16 py-4 flex items-center justify-between">
          <p className="text-sm text-white/80">© 2025 All Rights Reserved</p>
          <div className="flex items-center gap-3 opacity-90">
            <a href="#" aria-label="Facebook" className="hover:opacity-100">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:opacity-100">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="YouTube" className="hover:opacity-100">
              <Youtube className="h-5 w-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:opacity-100">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
function FooterList({ title, items }) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-white/90">
        {items.map((t) => (
          <li key={t}>
            <a href="#" className="hover:underline">
              {t}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
