import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "blob-wave-1": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(30px, -20px) scale(1.1)" },
        },
        "blob-wave-2": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-25px, 25px) scale(1.05)" },
        },
      },
      animation: {
        "blob-1": "blob-wave-1 12s ease-in-out infinite",
        "blob-2": "blob-wave-2 16s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
