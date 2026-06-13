/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "../../packages/renderer-angular-ui/src/**/*.{html,ts}",
    "../../packages/renderer-angular/src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
