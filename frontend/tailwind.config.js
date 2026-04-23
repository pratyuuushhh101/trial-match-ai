/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,jsx}',
        './src/components/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0F172A', // Navy
                    accent: '#0D9488', // Teal
                    light: '#14B8A6', // Bright Teal
                },
                verdict: {
                    meets: '#16A34A',
                    meetsBg: '#F0FDF4',
                    fails: '#DC2626',
                    failsBg: '#FEF2F2',
                    uncertain: '#D97706',
                    uncertainBg: '#FFFBEB',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
