import type { Config } from "tailwindcss";

const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Odoo-inspired semantic palette, driven by CSS variables (see globals.css)
        canvas: rgb("--c-canvas"),
        surface: rgb("--c-surface"),
        "surface-muted": rgb("--c-surface-muted"),
        sidebar: {
          DEFAULT: rgb("--c-sidebar"),
          hover: rgb("--c-sidebar-hover"),
          active: rgb("--c-sidebar-active"),
          border: rgb("--c-sidebar-border"),
          text: rgb("--c-sidebar-text"),
          muted: rgb("--c-sidebar-muted"),
        },
        primary: {
          DEFAULT: rgb("--c-primary"),
          hover: rgb("--c-primary-hover"),
          soft: rgb("--c-primary-soft"),
          softhover: rgb("--c-primary-softhover"),
          text: rgb("--c-primary-text"),
        },
        border: {
          DEFAULT: rgb("--c-border"),
          strong: rgb("--c-border-strong"),
        },
        content: {
          DEFAULT: rgb("--c-content"),
          muted: rgb("--c-content-muted"),
          subtle: rgb("--c-content-subtle"),
        },
        success: { DEFAULT: rgb("--c-success"), soft: rgb("--c-success-soft"), text: rgb("--c-success-text") },
        warning: { DEFAULT: rgb("--c-warning"), soft: rgb("--c-warning-soft"), text: rgb("--c-warning-text") },
        danger: { DEFAULT: rgb("--c-danger"), soft: rgb("--c-danger-soft"), text: rgb("--c-danger-text") },
        info: { DEFAULT: rgb("--c-info"), soft: rgb("--c-info-soft"), text: rgb("--c-info-text") },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.375rem" }],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)",
        drawer: "-8px 0 24px -8px rgba(16, 24, 40, 0.12)",
        dropdown:
          "0 4px 6px -2px rgba(16, 24, 40, 0.05), 0 12px 16px -4px rgba(16, 24, 40, 0.10)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
