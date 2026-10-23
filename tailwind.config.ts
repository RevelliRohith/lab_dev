import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        medblue: {
          50: "#f0f6ff",
          100: "#e0ecfe",
          200: "#bae0fd",
          500: "#2563eb",
          600: "#1565d8",
          700: "#104fad",
          800: "#0e3f8a",
          900: "#10213b",
        },
        navy: {
          800: "#172b4d",
          900: "#10213b",
          950: "#091220",
        },
        canvas: "#f5f8fc",
        cardbg: "#ffffff",
        borderline: "#e3eaf3",
        textpri: "#172b4d",
        textsec: "#64748b",
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#0d9488",
          600: "#0f766e",
          700: "#115e59",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(16, 33, 59, 0.05), 0 1px 2px 0 rgba(16, 33, 59, 0.03)",
        cardhover: "0 4px 12px 0 rgba(21, 101, 216, 0.08), 0 2px 4px 0 rgba(16, 33, 59, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
