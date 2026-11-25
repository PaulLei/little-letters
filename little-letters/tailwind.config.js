export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        paper: "hsl(var(--paper) / <alpha-value>)",
        ink: {
          DEFAULT: "hsl(var(--ink) / <alpha-value>)",
          soft: "hsl(var(--ink-soft) / <alpha-value>)",
        },
        blush: {
          DEFAULT: "hsl(var(--blush) / <alpha-value>)",
          deep: "hsl(var(--blush-deep) / <alpha-value>)",
        },
        sage: "hsl(var(--sage) / <alpha-value>)",
        butter: "hsl(var(--butter) / <alpha-value>)",
        hairline: "hsl(var(--hairline) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        destructive: "#AD4545",
      },
      fontFamily: {
        body: ["Lora", "Georgia", "serif"],
        display: ["Caveat", "Segoe Script", "cursive"],
        ui: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      keyframes: {
        "envelope-wiggle": {
          "0%,86%,100%": { transform: "rotate(0deg)" },
          "89%": { transform: "rotate(-1.6deg)" },
          "92%": { transform: "rotate(1.6deg)" },
          "95%": { transform: "rotate(-1deg)" },
          "98%": { transform: "rotate(0.5deg)" },
        },
        "soft-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "envelope-wiggle": "envelope-wiggle 9s ease-in-out infinite",
        "soft-in": "soft-in 0.5s ease-out both",
      },
    },
  },
};
