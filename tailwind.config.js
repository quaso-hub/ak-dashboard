/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface': {
          'DEFAULT': '#0f0f1a',
          '1': '#13131f',
          '2': '#1a1a2e',
          '3': '#1e1e35',
          '4': '#252540',
        },
        'brand': {
          '400': '#818cf8',
          '500': '#6366f1',
          '600': '#4f46e5',
        },
        'accent': '#06b6d4',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
