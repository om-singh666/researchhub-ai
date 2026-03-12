/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        accent: "#0f766e",
        sand: "#f7f4ea",
        coral: "#e76f51"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 18px 45px rgba(17, 24, 39, 0.12)"
      }
    },
  },
  plugins: [],
};
