/** @type {import('tailwindcss').Config} */
// FoodLens Design Tokens — bản sắc riêng: xanh lá tươi (fresh market),
// font Be Vietnam Pro, bo góc gọn hiện đại. Khác hẳn DrawToStory (hồng kem truyện cổ tích).
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fresh Market Tokens
        bg: '#F3F7EF',
        surface: '#FFFFFF',
        'surface-2': '#EAF2E2',
        'surface-3': '#DCE9CF',

        // Inks (WCAG 2.1 AA compliant)
        ink: {
          DEFAULT: '#1F2A1E',
          soft: '#4C5B4A',
          faint: '#7C8B78',
        },
        main: {
          DEFAULT: '#1F2A1E',
          light: '#4C5B4A',
          muted: '#4C5B4A',
          subtle: '#7C8B78',
        },

        // Brand Palette — Emerald
        brand: {
          100: '#DFF2E3',
          400: '#43A35F',
          600: '#1E7A46',
          700: '#175C35',
        },
        primary: {
          DEFAULT: '#1E7A46',
          hover: '#175C35',
          light: '#DFF2E3',
          dark: '#175C35',
        },

        // Accent — Amber (calo / năng lượng)
        magic: {
          DEFAULT: '#B45309',
          600: '#B45309',
          700: '#92400E',
        },
        accent: {
          DEFAULT: '#B45309',
          hover: '#92400E',
          light: '#FBEEDB',
          dark: '#92400E',
        },

        // Pastel Decorative (backgrounds only, text always ink)
        mint: {
          DEFAULT: '#CDEBCB',
          light: '#E7F6E3',
          dark: '#A5DCA0',
        },
        sky: {
          DEFAULT: '#CDE7FF',
          light: '#EAF4FF',
          dark: '#A6D3FF',
        },
        lavender: {
          DEFAULT: '#E6EFD2',
          light: '#F4F9E8',
          dark: '#CFE0A8',
        },
        butter: {
          DEFAULT: '#FFF1B8',
          light: '#FFF9DC',
          dark: '#FFE485',
        },
        peach: {
          DEFAULT: '#FFDFC4',
          light: '#FFF0E0',
          dark: '#F7BE8F',
        },

        // Nested & Top-level Semantic Status Tokens (WCAG AA Verified)
        status: {
          'success-bg': '#DDF6E9',
          'success-text': '#166E48',
          'warning-bg': '#FFF1B8',
          'warning-text': '#8A5A00',
          'danger-bg': '#FFE3EA',
          'danger-text': '#B42343',
          'info-bg': '#CDE7FF',
          'info-text': '#1F5FA8',
        },
        danger: '#B42343',
        'danger-bg': '#FFE3EA',
        'danger-text': '#B42343',
        success: '#166E48',
        'success-bg': '#DDF6E9',
        'success-text': '#166E48',
        warning: '#8A5A00',
        'warning-bg': '#FFF1B8',
        'warning-text': '#8A5A00',
        info: '#1F5FA8',
        'info-bg': '#CDE7FF',
        'info-text': '#1F5FA8',

        cream: {
          DEFAULT: '#F3F7EF',
          50: '#FFFFFF',
          100: '#FAFCF7',
          200: '#F3F7EF',
          300: '#EAF2E2',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        story: ['"Be Vietnam Pro"', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        input: '14px',
        pill: '9999px',
        '3xl': '1.25rem',
        '4xl': '20px',
        '5xl': '2rem',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(31,42,30,.05)',
        card: '0 1px 2px rgba(31,42,30,.06), 0 12px 32px -12px rgba(31,42,30,.16)',
        pop: '0 24px 48px -16px rgba(31,42,30,.28)',
        soft: '0 1px 2px rgba(31,42,30,.06), 0 12px 32px -12px rgba(31,42,30,.16)',
        'soft-lg': '0 24px 48px -16px rgba(31,42,30,.28)',
        'soft-inner': 'inset 0 2px 4px 0 rgba(31, 42, 30, 0.06)',
        'btn-primary': '0 8px 20px -8px rgba(30, 122, 70, 0.5)',
        'btn-magic': '0 8px 20px -8px rgba(180, 83, 9, 0.5)',
        'glow-primary': '0 0 25px -2px rgba(30, 122, 70, 0.35)',
        'glow-accent': '0 0 25px -2px rgba(180, 83, 9, 0.35)',
      },
      backgroundImage: {
        'magic-gradient': 'linear-gradient(135deg, #43A35F, #E8A33D)',
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        sparkle: 'sparkle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
