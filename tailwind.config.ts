import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        brand: ["var(--font-brand)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#1F3A5F",
        },
      },
    },
  },
  plugins: [],
};

export default config;
