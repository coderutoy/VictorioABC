/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#464B71',
          dark: '#343857',
          light: '#5A608C',
        },
        clinical: {
          DEFAULT: '#118AB2',
          dark: '#0D6E8E',
          light: '#E6F5FA',
        },
        mint: {
          DEFAULT: '#7CD5C7',
          light: '#EAFBF8',
          dark: '#1E6B60',
        },
        cream: {
          DEFAULT: '#F2F2ED',
          border: '#DDDCD4',
        },
        brand: {
          50: '#EAFBF8',
          100: '#D5F6F0',
          200: '#7CD5C7',
          500: '#118AB2',
          600: '#118AB2',
          700: '#0D6E8E',
          800: '#464B71',
          900: '#343857',
        },
      },
    },
  },
  plugins: [],
};
