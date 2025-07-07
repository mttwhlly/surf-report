// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./src/js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'InterVariable', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'emoji': ['Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Arial', 'sans-serif']
      },
      colors: {
        'surf': {
          'blue': '#0077cc',
          'blue-dark': '#003366',
          'blue-light': '#4a9eff'
        },
        'tide': {
          'high': '#10b981',
          'low': '#f59e0b'
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      backdropBlur: {
        '20': '20px'
      },
      backdropSaturate: {
        '180': '180%'
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'bell-ring': 'bell-ring 0.5s ease-in-out',
        'slide-in': 'slide-in 0.3s ease',
        'wind-flow': 'wind-flow 3s linear infinite',
        'period-wave': 'period-wave 4s ease-in-out infinite',
        'blob-float': 'blob-float 25s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite'
      },
      keyframes: {
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' }
        },
        'bell-ring': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'rotate(-3deg)' },
          '20%, 40%, 60%, 80%': { transform: 'rotate(3deg)' }
        },
        'slide-in': {
          'from': {
            opacity: '0',
            transform: 'translateX(-50%) translateY(-20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(-50%) translateY(0)'
          }
        },
        'wind-flow': {
          '0%': { transform: 'translateX(-100px) translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(300px) translateY(0)', opacity: '0' }
        },
        'period-wave': {
          '0%, 100%': { transform: 'translateY(0) scaleX(1)', opacity: '0.3' },
          '50%': { transform: 'translateY(-10px) scaleX(1.2)', opacity: '0.8' }
        },
        'blob-float': {
          '0%, 100%': { 
            transform: 'translate(0, 0) scale(1) rotate(0deg)',
          },
          '25%': { 
            transform: 'translate(-30px, -40px) scale(1.05) rotate(90deg)',
          },
          '50%': { 
            transform: 'translate(40px, -30px) scale(0.95) rotate(180deg)',
          },
          '75%': { 
            transform: 'translate(-20px, 35px) scale(1.02) rotate(270deg)',
          }
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        'scale-in': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' }
        }
      },
      transitionDuration: {
        '3000': '3000ms',
        '5000': '5000ms'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },
      blur: {
        '20': '20px'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
  corePlugins: {
    // Disable some core plugins we don't need
    container: false,
    float: false,
    clear: false,
  },
  variants: {
    extend: {
      animation: ['hover', 'focus', 'group-hover'],
      backdropBlur: ['hover', 'focus'],
      backdropSaturate: ['hover', 'focus'],
      scale: ['group-hover'],
      rotate: ['group-hover'],
      translate: ['group-hover']
    }
  }
}

// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

