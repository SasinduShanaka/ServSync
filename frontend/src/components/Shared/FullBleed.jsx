// src/components/Shared/FullBleed.jsx
import React from 'react';

/**
 * FullBleed wrapper: Escapes parent containers/gutters and expands child content to full viewport width.
 * Useful for pages rendered inside a centered layout (e.g., UserLayout) when you need edge-to-edge sections.
 */
export default function FullBleed({ className = "", children }) {
  return (
    <div className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen ${className}`}>
      {children}
    </div>
  );
}
