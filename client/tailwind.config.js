/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16211d',
        forest: '#174c3c',
        'forest-dark': '#10372c',
        paper: '#f7f8f6',
        line: '#d8dedb',
        accent: '#b54235',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(22, 33, 29, 0.10)',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
