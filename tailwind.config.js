/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#4285f4',
        success: '#0f9d58',
        warning: '#f4b400',
        danger: '#db4437',
        'primary-dark': '#3367d6',
        'success-dark': '#0b8043'
      },
      animation: {
        'fade-in-out': 'fadeInOut 2s ease-in-out'
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' }
        }
      }
    }
  },
  plugins: []
}