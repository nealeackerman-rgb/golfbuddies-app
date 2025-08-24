import React from 'react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 210 40" xmlns="http://www.w3.org/2000/svg">
    <text
      x="50%"
      y="50%"
      dy=".3em"
      textAnchor="middle"
      fontSize="32"
      fontFamily="sans-serif"
      fontWeight="bold"
    >
      <tspan fill="#10B981">Golf</tspan>
      <tspan fill="#4B5563">Buddies</tspan>
    </text>
  </svg>
);