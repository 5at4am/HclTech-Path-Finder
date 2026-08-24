/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090B",
        surface: "#111114",
        elevated: "#18181C",
        hover: "#202024",
        border: "#27272A",
        "border-subtle": "#1F1F23",
        primary: "#F4F4F5",
        secondary: "#A1A1AA",
        muted: "#71717A",
        disabled: "#52525B",
        accent: "#8B5CF6",
        "accent-soft": "rgba(139,92,246,0.12)",
        progress: "#14B8A6",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn: "11px",
        card: "16px",
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
