import React from 'react';

export interface DeliveryMotorbikeIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const DeliveryMotorbikeIcon: React.FC<DeliveryMotorbikeIconProps> = ({
  className = 'w-5 h-5',
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      {/* Delivery Cargo Box on Rear Rack */}
      <rect x="2" y="5.5" width="6.5" height="7" rx="1" />
      <line x1="2" y1="9" x2="8.5" y2="9" />

      {/* Rear Wheel */}
      <circle cx="5.5" cy="18" r="2.5" />

      {/* Front Wheel */}
      <circle cx="18.5" cy="18" r="2.5" />

      {/* Rear Box Mount to Axle */}
      <line x1="5.5" y1="12.5" x2="5.5" y2="15.5" />

      {/* Bike Frame & Seat */}
      <path d="M8.5 12.5h3l2.5-3.5h2.5" />

      {/* Steering Handlebars */}
      <line x1="15" y1="6.5" x2="17.5" y2="6.5" />
      <line x1="16.5" y1="6.5" x2="16.5" y2="9" />

      {/* Front Fork to Wheel Hub */}
      <line x1="16.5" y1="9" x2="18.5" y2="18" />

      {/* Lower Frame / Engine */}
      <path d="M8 18h4l2-3.5" />
    </svg>
  );
};
