import React from 'react';

/** Original Clash of Elites insignia: split crown, opposing blades, and a central arena gate. */
export const BrandMark: React.FC<{ className?: string; title?: string }> = ({ className = '', title = 'Clash of Elites' }) => (
  <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title} fill="none">
    <path d="M32 3.5 55.5 13v17.2c0 14.5-9.8 24.4-23.5 30.3C16.3 54.6 6.5 44.7 6.5 30.2V13L32 3.5Z" fill="url(#ce-shell)" stroke="currentColor" strokeWidth="1.7" />
    <path d="m13.5 16.5 12.2-4.7 6.3 3.1 6.3-3.1 12.2 4.7v13.7c0 11.1-7.1 19.4-18.5 24.6-11.4-5.2-18.5-13.5-18.5-24.6V16.5Z" stroke="#526A31" strokeOpacity=".9" strokeWidth="1.5" />
    <path d="m17.5 23.1 8.2 5.5-7.4 1.1 4.7 4.1M46.5 23.1l-8.2 5.5 7.4 1.1-4.7 4.1" stroke="#34491F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24.8 20.7h14.4M24.8 25.4h9.4M24.8 30.1h14.4M24.8 34.8h9.4" stroke="#253719" strokeWidth="3" strokeLinecap="square" />
    <path d="m32 14.2 2.3 3.3-2.3 3.2-2.3-3.2 2.3-3.3Z" fill="#253719" />
    <text x="32" y="45.5" textAnchor="middle" fill="#253719" fontSize="8" fontWeight="900" fontFamily="Orbitron, sans-serif" letterSpacing="-.5">CE</text>
    <defs><linearGradient id="ce-shell" x1="9" y1="7" x2="52" y2="57" gradientUnits="userSpaceOnUse"><stop stopColor="#F3FFB1"/><stop offset=".56" stopColor="#C5ED5A"/><stop offset="1" stopColor="#89B532"/></linearGradient></defs>
  </svg>
);
