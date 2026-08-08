import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{jsx,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans:  ['Inter', 'SF Pro Text', ...defaultTheme.fontFamily.sans],
                title: ['Outfit', 'SF Pro Display', ...defaultTheme.fontFamily.sans],
            },

            colors: {
                // Brand / Accent
                primary:   '#0066cc',
                'primary-focus': '#0071e3',
                'primary-dark': '#2997ff',   // Sky Link Blue (dark theme)

                // Semantic
                success:   '#30d158',
                warning:   '#ff9f0a',
                danger:    '#ff453a',

                // Surface (dark-first, mirrors CSS vars)
                canvas:    '#000000',
                card:      '#1d1d1f',
                sidebar:   '#161617',

                // Text
                'text-muted': '#86868b',
            },

            borderRadius: {
                card: '18px',
            },

            transitionTimingFunction: {
                apple: 'cubic-bezier(0.25, 1, 0.5, 1)',
            },

            transitionDuration: {
                DEFAULT: '400ms',
            },

            backdropBlur: {
                card: '20px',
            },

            letterSpacing: {
                tight: '-0.015em',
            },
        },
    },

    plugins: [forms],
};
