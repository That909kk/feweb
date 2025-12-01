/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1F4D70',
          navyHover: '#2C6A94',
          teal: '#2F9C95',
          secondary: '#F4A261',
          surface: '#FFFFFF',
          background: '#EEF2F6',
          outline: '#94A3B8',
          text: '#0B1D26'
        },
        status: {
          success: '#0F9D58',
          warning: '#F4B400',
          danger: '#D93025',
          info: '#4285F4'
        }
      },
      boxShadow: {
        'elevation-sm': '0 8px 24px -12px rgba(31, 77, 112, 0.35)',
        'elevation-md': '0 18px 44px -16px rgba(31, 77, 112, 0.28)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif']
      },
      opacity: {
        '19': '0.19',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out'
      }
    },
  },
  plugins: [],
}
