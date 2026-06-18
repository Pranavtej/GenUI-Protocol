/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "../../packages/renderers/angular-ui/src/**/*.{html,ts}",
    "../../packages/renderers/angular/src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
