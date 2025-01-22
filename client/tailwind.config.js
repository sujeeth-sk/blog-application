/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  purge: {
    mode: 'all',
    content: [
      './{components,pages,layout}/*/.{jsx,tsx}',
      'node_modules/react-toastify/dist/ReactToastify.css',
    ],
  },
}

