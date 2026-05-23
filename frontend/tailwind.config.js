/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // KOMPAS brand purple — accent across the app
        brand: {
          DEFAULT: "#994BFF",
          50:  "#F5EDFF",
          100: "#E7D5FF",
          200: "#D0AEFF",
          300: "#B988FF",
          400: "#A668FF",
          500: "#994BFF",
          600: "#7A35E0",
          700: "#5E26B5",
          800: "#421A82",
          900: "#2B1158",
        },
        // Legacy "navy" tokens remapped to KOMPAS dark-surface scale.
        // Pages keep their utility classes but render in the new palette.
        navy: {
          50:  "#F5F5F5",
          100: "#E5E5E5",
          200: "#A0A0A0",
          300: "#A0A0A0",
          400: "#606060",
          500: "#404040",
          600: "#303030",
          700: "#2A2A2A",
          800: "#242424",
          900: "#1E1E1E",
          950: "#171717",
        },
        // Legacy "gold" tokens remapped to brand purple scale.
        gold: {
          50:  "#F5EDFF",
          100: "#E7D5FF",
          200: "#D0AEFF",
          300: "#B988FF",
          400: "#A668FF",
          500: "#994BFF",
          600: "#7A35E0",
          700: "#5E26B5",
          800: "#421A82",
          900: "#2B1158",
        },
      },
      fontFamily: {
        sans: [
          "PP Neue Machina",
          "Space Grotesk",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "PP Neue Machina",
          "Space Grotesk",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        // Depth is borders, not shadows — kept defined so legacy classes resolve flat.
        glass: "none",
        "glass-lg": "none",
        soft: "none",
        ring: "0 0 0 0.5px rgba(153, 75, 255, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
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
