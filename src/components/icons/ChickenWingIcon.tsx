import React from 'react';

interface ChickenWingIconProps {
  className?: string;
  size?: number;
}

export const ChickenWingIcon: React.FC<ChickenWingIconProps> = ({ className = 'w-5 h-5', size = 24 }) => {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      width={size}
      height={size}
      aria-label="Chicken Wing"
    >
      {/* Wing Bone Joint at the top-left / base */}
      <ellipse cx="6.5" cy="27" rx="3" ry="2.2" fill="#FDE68A" stroke="#D97706" strokeWidth="1" transform="rotate(-25 6.5 27)" />
      <ellipse cx="9" cy="29" rx="2.5" ry="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" transform="rotate(-25 9 29)" />

      {/* Main Glazed Chicken Wing (Drumette & Mid-joint flat) */}
      <path
        d="M7 26.5C5.8 23 6.5 18 9 14C12 9.5 17 6 22.5 5.5C26.5 5.1 29.5 7.5 30.5 11C31.5 14.5 29.5 18 26.5 21C23 24.5 18.5 27.5 13.5 28.5C10.5 29 8 28.5 7 26.5Z"
        fill="url(#wingGradient)"
        stroke="#9A3412"
        strokeWidth="1.5"
      />

      {/* Crispy Top Wing Ridge / Highlight */}
      <path
        d="M10.5 15C13 11 17.5 8 22 7.5C25.5 7 28 8.8 29 11.5"
        stroke="#FDE047"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Charred Flame Grill Marks */}
      <path
        d="M14 13C16.5 15.5 19.5 18 22.5 20.5"
        stroke="#7C2D12"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 10.5C20.5 13 23 15.5 25.5 18"
        stroke="#7C2D12"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M22 8C24 10 26 12 28 14"
        stroke="#7C2D12"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11 17.5C13 19.5 15.5 22 18 24"
        stroke="#7C2D12"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Glaze sheen */}
      <ellipse cx="23" cy="11" rx="3.5" ry="1.5" fill="#FEF08A" opacity="0.6" transform="rotate(-30 23 11)" />

      <defs>
        <linearGradient id="wingGradient" x1="6" y1="6" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="0.4" stopColor="#EA580C" />
          <stop offset="0.8" stopColor="#C2410C" />
          <stop offset="1" stopColor="#9A3412" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default ChickenWingIcon;
