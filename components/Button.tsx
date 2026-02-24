import React from 'react';
import { sounds } from '../services/soundService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  onClick,
  onMouseEnter,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    // Purple theme primary
    primary: "bg-purple-600 hover:bg-purple-500 text-white focus:ring-purple-500 shadow-md border border-transparent hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    // Dark secondary
    secondary: "bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500 shadow-sm border border-slate-600",
    // Outline for dark theme
    outline: "border-2 border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white hover:bg-slate-800 focus:ring-slate-500 bg-transparent",
    // Ghost for dark theme
    ghost: "text-slate-400 hover:bg-slate-800 hover:text-white focus:ring-slate-500"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading) {
      sounds.playClick();
      if (onClick) onClick(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      sounds.playHover();
      if (onMouseEnter) onMouseEnter(e);
    }
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
