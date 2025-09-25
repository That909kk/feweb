import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  isPasswordVisible?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, showPasswordToggle, onTogglePassword, isPasswordVisible, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        <label 
          className="block text-xl lg:text-2xl font-normal"
          style={{ 
            color: '#000000',
            fontFamily: 'Poppins'
          }}
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full h-16 lg:h-18 px-6 
              border-2 rounded-lg
              text-lg lg:text-xl font-normal placeholder:text-gray-400
              focus:outline-none focus:border-orange-400
              bg-white transition-colors
              ${showPasswordToggle ? 'pr-16' : ''}
              ${className || ''}
            `}
            style={{ 
              borderColor: '#D2D2D2',
              fontFamily: 'Poppins'
            }}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="25"
                height="20"
                viewBox="0 0 25 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.5 0C7.5 0 3.23 3.11 1.5 7.5C3.23 11.89 7.5 15 12.5 15C17.5 15 21.77 11.89 23.5 7.5C21.77 3.11 17.5 0 12.5 0ZM12.5 12.5C10.02 12.5 8 10.48 8 8C8 5.52 10.02 3.5 12.5 3.5C14.98 3.5 17 5.52 17 8C17 10.48 14.98 12.5 12.5 12.5ZM12.5 5.5C11.12 5.5 10 6.62 10 8C10 9.38 11.12 10.5 12.5 10.5C13.88 10.5 15 9.38 15 8C15 6.62 13.88 5.5 12.5 5.5Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <p 
            className="text-sm text-red-500"
            style={{ fontFamily: 'Poppins' }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;