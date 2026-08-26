/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces (light/dark via CSS variables in index.css).
        bg: "var(--color-background)",
        "bg-subtle": "var(--color-background-subtle)",
        surface: "var(--color-surface)",
        "surface-secondary": "var(--color-surface-secondary)",
        "surface-tertiary": "var(--color-surface-tertiary)",
        elevated: "var(--color-surface-elevated)",
        card: "var(--color-card)",

        border: "var(--color-border)",
        "border-subtle": "var(--color-border-subtle)",
        "border-strong": "var(--color-border-strong)",

        // Brand = purple (primary direction), Accent = orange (attention).
        brand: "var(--color-brand)",
        "brand-hover": "var(--color-brand-hover)",
        "brand-active": "var(--color-brand-active)",
        "brand-soft": "var(--color-brand-soft)",
        "brand-muted": "var(--color-brand-muted)",
        "on-brand": "var(--color-on-brand)",

        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-active": "var(--color-accent-active)",
        "accent-soft": "var(--color-accent-soft)",
        "on-accent": "var(--color-on-accent)",

        "text-primary": "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-disabled": "var(--color-text-disabled)",

        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",

        // Purple scale (brand).
        "purple-50": "var(--purple-50)",
        "purple-100": "var(--purple-100)",
        "purple-200": "var(--purple-200)",
        "purple-300": "var(--purple-300)",
        "purple-400": "var(--purple-400)",
        "purple-500": "var(--purple-500)",
        "purple-600": "var(--purple-600)",
        "purple-700": "var(--purple-700)",
        "purple-800": "var(--purple-800)",
        "purple-900": "var(--purple-900)",

        // Orange scale (accent).
        "orange-50": "var(--orange-50)",
        "orange-100": "var(--orange-100)",
        "orange-200": "var(--orange-200)",
        "orange-300": "var(--orange-300)",
        "orange-400": "var(--orange-400)",
        "orange-500": "var(--orange-500)",
        "orange-600": "var(--orange-600)",
        "orange-700": "var(--orange-700)",
        "orange-800": "var(--orange-800)",
        "orange-900": "var(--orange-900)",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
        btn: "10px",
        card: "14px",
        panel: "20px",
        feature: "28px",
      },
      backgroundImage: {
        route: "linear-gradient(90deg, var(--purple-700) 0%, var(--purple-500) 100%)",
        signature: "linear-gradient(135deg, var(--purple-500) 0%, var(--orange-500) 100%)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        brand: "var(--shadow-brand)",
      },
      maxWidth: {
        container: "var(--container-width)",
      },
    },
  },
  plugins: [],
};
