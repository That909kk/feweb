import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold leading-tight transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-teal rounded-full';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-brand-navy text-white hover:-translate-y-0.5 hover:bg-brand-navyHover shadow-elevation-sm',
    secondary:
      'bg-brand-teal text-white hover:-translate-y-0.5 hover:bg-brand-teal/90 shadow-elevation-sm',
    outline:
      'border border-brand-outline/70 text-brand-navy hover:-translate-y-0.5 hover:border-brand-navy hover:bg-brand-background/60',
    ghost: 'text-brand-navy hover:text-brand-navyHover hover:bg-brand-outline/20'
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm sm:text-base',
    lg: 'h-12 px-6 text-base sm:text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={[
        baseClasses,
        variants[variant],
        sizes[size],
        widthClass,
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
