
import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        coral: '#FF9B9B',
        turquoise: '#7DD3C0',
        lavender: '#E6D5F5',
        mint: '#E8F5E9',
        peach: '#FFE8E0',
        sky: '#E3F2FD',
        dark: '#2C2C2C',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
