/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef9f4',
          100: '#d6f1e3',
          200: '#b0e3cc',
          300: '#7dcdb0',
          400: '#4db592',
          500: '#2a9d76',
          600: '#1e7d5e',
          700: '#1a6450',
          800: '#174f40',
          900: '#144235',
          950: '#0a251e',
        },
        surface: {
          50:  '#f8faf9',
          100: '#f0f4f2',
          200: '#e2ebe6',
          300: '#c8d9d0',
          400: '#9bbdad',
          500: '#6fa08e',
          600: '#547d6e',
          700: '#436358',
          800: '#384f47',
          900: '#2f423c',
          950: '#1a2622',
        },
        accent: '#f4a623',
        danger: '#e53e3e',
        warning: '#f6ad55',
        success: '#48bb78',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-right': 'slideRight 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideRight: {
          '0%': { opacity: 0, transform: 'translateX(-20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        'glow': '0 0 20px rgba(42, 157, 118, 0.25)',
        'glow-accent': '0 0 20px rgba(244, 166, 35, 0.3)',
      },
      backgroundImage: {
        'mesh-green': 'radial-gradient(at 40% 20%, #2a9d7620 0px, transparent 50%), radial-gradient(at 80% 0%, #1e7d5e15 0px, transparent 50%), radial-gradient(at 0% 50%, #4db59210 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}
