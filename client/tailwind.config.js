/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#004DA7", // First Horizon Corporate Cobalt Blue
          600: "#004394",
          700: "#003882",
          800: "#002a66",
          900: "#001F5F", // First Horizon Deep Abyss Navy
          950: "#001438",
        },
        navy: {
          800: "#002766",
          900: "#001F5F", // First Horizon Institutional Navy
          950: "#001438",
        },
        fh: {
          blue: "#004DA7",
          navy: "#001F5F",
          red: "#E2231A",
          darkred: "#c81e16",
          darkblue: "#001438",
          bg: "#F4F6F9",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
