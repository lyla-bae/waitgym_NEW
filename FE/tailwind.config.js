/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#293241',
        card: '#334155',
        modal: '#272C34',
        primary: '#3D5A80',
        accent: '#EF754D',
        'status-blue': '#98C1D9',
        muted: '#9299A5',
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
