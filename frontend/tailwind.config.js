/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Turonbank brand
        navy: {
          50: "#f3f6fb",
          100: "#e2e9f3",
          200: "#c4d2e6",
          300: "#9ab0d0",
          400: "#6a87b6",
          500: "#46659c",
          600: "#34507f",
          700: "#284067",
          800: "#152547",
          900: "#0A1628",
          950: "#06101d",
        },
        gold: {
          50: "#fbf8ee",
          100: "#f5edcf",
          200: "#ead89b",
          300: "#ddbe63",
          400: "#d2a93f",
          500: "#C9A84C",
          600: "#a87a26",
          700: "#865923",
          800: "#704924",
          900: "#603e22",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "SF Pro Display",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(10, 22, 40, 0.08)",
        "glass-lg": "0 20px 60px -20px rgba(10, 22, 40, 0.15)",
        soft: "0 1px 3px rgba(10, 22, 40, 0.04), 0 4px 12px rgba(10, 22, 40, 0.04)",
        ring: "0 0 0 4px rgba(201, 168, 76, 0.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
