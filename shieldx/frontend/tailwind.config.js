/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f4c35',
          light:   '#1a7a56',
          pale:    '#e8f5ef',
          dark:    '#071a12',
        },
        accent: {
          DEFAULT: '#e8a020',
          light:   '#fdf3e0',
          dark:    '#b87d10',
        },
        surface: '#f7f9f8',
        danger:  '#c0392b',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        card:  '0 2px 16px 0 rgba(15,76,53,0.08)',
        float: '0 8px 40px 0 rgba(15,76,53,0.14)',
        glow:  '0 0 32px 0 rgba(232,160,32,0.25)',
      },
    },
  },
  plugins: [],
}