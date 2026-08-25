/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // All tokens map to the Volcanic Ash CSS variables defined in index.css,
        // so every utility re-themes and supports light/dark automatically.
        // NOTE: in this codebase `accent` = brand purple, `signal` = signal orange
        // (matching the existing component usage).
        bg: "var(--color-background)",
        "bg-subtle": "var(--color-background-subtle)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-secondary)",
        elevated: "var(--color-surface-elevated)",
        hover: "var(--color-surface-tertiary)",
        border: "var(--color-border)",
        "border-subtle": "var(--color-border-subtle)",
        primary: "var(--color-text)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",
        disabled: "var(--color-text-disabled)",
        // brand / interaction (purple)
        accent: "var(--color-brand)",
        "accent-soft": "var(--color-brand-soft)",
        "accent-active": "var(--color-brand-active)",
        // signal / attention (orange)
        signal: "var(--color-accent)",
        "signal-soft": "var(--color-accent-soft)",
        "signal-active": "var(--color-accent-active)",
        // data visualization main dataset (purple)
        progress: "var(--color-brand)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Evidence / data mono — visually marks "this is a literal fact pulled
        // from data" (skill %, similarity scores, evidence quotes).
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        // Brand gradient — purple only. Used for the logo mark and path line.
        route: "linear-gradient(90deg, var(--purple-700) 0%, var(--purple-500) 100%)",
        // Signature gradient — purple → orange, reserved for special CTAs / highlights.
        signature: "linear-gradient(135deg, var(--purple-500) 0%, var(--orange-500) 100%)",
      },
      borderRadius: {
        btn: "10px",
        card: "14px",
        panel: "20px",
      },
      spacing: {
        "4": "4px", "8": "8px", "12": "12px", "16": "16px", "20": "20px",
        "24": "24px", "32": "32px", "40": "40px", "48": "48px",
        "64": "64px", "80": "80px", "96": "96px",
      },
    },
  },
  plugins: [],
};
