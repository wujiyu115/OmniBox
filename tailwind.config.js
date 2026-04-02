/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          input: 'var(--bg-input)',
          text: 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          border: 'var(--border-color)',
          'border-light': 'var(--border-light)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'accent-text': 'var(--accent-text)',
          success: 'var(--success)',
          error: 'var(--error)',
        },
      },
    },
  },
  plugins: [],
}

