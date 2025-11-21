/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          neon: "#8a2be2",
          blue: "#00d4ff",
          green: "#00ff9d"
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.5)",
      }
    }
  },
  plugins: []
}