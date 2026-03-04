import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        dark: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        // Warm orange accent
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        // ESG dimension colors (SDG-inspired)
        dim: {
          e: "#059669",   // Environment — emerald-600
          s: "#0284c7",   // Social — sky-600
          g: "#7c3aed",   // Governance — violet-600
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      keyframes: {
        ringFill: {
          from: { strokeDasharray: "0 999" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },
        countUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },
      },
      animation: {
        ring:      "ringFill 1s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out",
        "count-up": "countUp 0.6s ease-out",
      },
    },
  },
  plugins: [],
}

export default config
