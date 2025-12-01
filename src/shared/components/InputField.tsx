import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  isPasswordVisible?: boolean;
  hint?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    { label, error, showPasswordToggle, onTogglePassword, isPasswordVisible, className, hint, ...props },
    ref
  ) => {
    const inputClasses = [
      'w-full rounded-2xl border border-brand-outline/60 bg-white px-4 py-3 text-sm text-brand-text/80 transition',
      'placeholder:text-brand-text/40 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal focus:ring-offset-1 focus:outline-none',
      showPasswordToggle ? 'pr-12' : '',
      error ? 'border-status-danger focus:border-status-danger focus:ring-status-danger/30' : '',
      className ?? ''
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-brand-navy">{label}</label>
          {hint && <span className="text-xs text-brand-text/50">{hint}</span>}
        </div>
        <div className="relative">
          <input ref={ref} className={inputClasses} {...props} />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label={isPasswordVisible ? 'An mat khau' : 'Hien mat khau'}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-text/50 transition hover:text-brand-navy"
            >
              {isPasswordVisible ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-7.5a10.54 10.54 0 0 1 4-4.88" />
                  <path d="M1 1l22 22" />
                  <path d="M9.53 9.53a3 3 0 0 0 4.24 4.24" />
                  <path d="M14.47 14.47l-1.41 1.41" />
                  <path d="M9.88 9.88L8.47 8.47" />
                  <path d="M12 5a7 7 0 0 1 7 7 7.3 7.3 0 0 1-.35 2.16" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
