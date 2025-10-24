// src/pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">404</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Page not found.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Go Home
        </Link>
      </div>
    </div>
  );
}
