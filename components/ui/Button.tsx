import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase";
  
  const variants = {
    // Primary is now the Orange Accent
    primary: "bg-brand-orange text-white hover:bg-amber-600 shadow-md hover:shadow-lg focus:ring-brand-orange border border-transparent",
    // Secondary is the Teal Brand
    secondary: "bg-brand-teal text-white hover:bg-brand-dark shadow-md hover:shadow-lg focus:ring-brand-teal border border-transparent",
    // Outline
    outline: "border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white focus:ring-brand-orange bg-transparent",
    ghost: "text-brand-teal hover:bg-brand-teal/10 focus:ring-brand-teal",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};