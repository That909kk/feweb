import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
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
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none';
  
  const variants = {
    primary: 'hover:opacity-90 focus:opacity-90',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300',
    ghost: 'bg-transparent hover:opacity-70'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm h-10',
    md: 'px-6 py-3 text-lg lg:text-xl h-12',
    lg: 'px-8 py-4 text-2xl lg:text-3xl h-16 lg:h-20'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const getVariantStyles = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: '#FF9900',
        color: '#FAFAFA',
        fontFamily: 'Poppins'
      };
    }
    return {};
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${widthClass}
        ${className || ''}
      `}
      style={getVariantStyles()}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;