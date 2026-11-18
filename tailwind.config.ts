import type { Config } from 'tailwindcss'

const config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6741d9',
          dark: '#5230bb',
          pale: '#f0ecfc',
        },
        ink: '#24252b',
        muted: '#777984',
        line: '#e6e5e2',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
