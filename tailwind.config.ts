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
        ledger: {
          paper: "#F8FAFC",      // Slate-50 limpo e contemporâneo
          surface: "#FFFFFF",    // Branco puro
          border: "#E2E8F0",     // Slate-200 refinado
          "border-strong": "#CBD5E1", // Slate-300
          subtle: "#F1F5F9",     // Slate-100 suave
          text: "#0F172A",       // Slate-900 legibilidade superior
          muted: "#64748B",      // Slate-500
        },
        sempi: {
          plum: "var(--sempi-plum, #581526)",
          "plum-hover": "var(--sempi-plum-hover, #420F1D)",
          "plum-light": "var(--sempi-plum-light, #FDF2F4)",
          "plum-border": "var(--sempi-plum-border, #F3D1D9)",
          teal: "var(--sempi-teal, #0D3B3E)",
          "teal-hover": "var(--sempi-teal-hover, #09292B)",
          "teal-light": "var(--sempi-teal-light, #F0FDFA)",
          "teal-border": "var(--sempi-teal-border, #CCFBF1)",
        },
        status: {
          vigente: "#15803D",
          "vigente-bg": "#F0FDF4",
          "vigente-border": "#BBF7D0",
          alerta: "#B45309",
          "alerta-bg": "#FFFBEB",
          "alerta-border": "#FDE68A",
          anomalia: "#B91C1C",
          "anomalia-bg": "#FEF2F2",
          "anomalia-border": "#FECACA",
          encerrado: "#475569",
          "encerrado-bg": "#F8FAFC",
          "encerrado-border": "#E2E8F0",
        },
      },
      fontFamily: {
        serif: ["var(--font-editorial)", "Newsreader", "Instrument Serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "IBM Plex Mono", "SF Mono", "monospace"],
      },
      borderRadius: {
        none: "0px",
        xs: "3px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        drawer: "-4px 0 24px 0 rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
