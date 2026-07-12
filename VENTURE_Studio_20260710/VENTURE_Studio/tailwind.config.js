/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F', card: '#111118', border: '#1E293B',
        primary: '#7C3AED', accent: '#06B6D4', amber: '#F59E0B',
        success: '#10B981', danger: '#EF4444',
        text: '#F8FAFC', muted: '#94A3B8', dim: '#64748B',
      },
    },
  },
  plugins: [],
};
