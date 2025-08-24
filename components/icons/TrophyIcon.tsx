import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <defs>
      <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <path
      fill="url(#gold-gradient)"
      d="M19,4H5A2,2 0 0,0 3,6V10C3,12.76 5.24,15 8,15V20H16V15C18.76,15 21,12.76 21,10V6A2,2 0 0,0 19,4Z"
    />
  </svg>
);
