import React from 'react';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  textSize?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = "flex items-center gap-2 cursor-pointer select-none group",
  imageClassName = "w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform duration-300 group-hover:scale-105",
  showText = true,
  textSize = "text-base sm:text-lg font-black tracking-tight text-slate-900",
  onClick
}) => {
  return (
    <div className={className} onClick={onClick}>
      <img 
        src="/logo.png" 
        alt="وثيق" 
        className={imageClassName}
        style={{ objectFit: 'contain' }}
      />
      {showText && (
        <span className={textSize}>
          وثيق
        </span>
      )}
    </div>
  );
};
