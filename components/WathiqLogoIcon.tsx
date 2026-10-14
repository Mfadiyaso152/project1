import React from 'react';
export const WathiqLogoIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <img src="/logo.png" alt="وثيق" className={className} style={{ objectFit: 'contain' }} />
);
