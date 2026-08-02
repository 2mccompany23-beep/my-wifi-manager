import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            colors: {
                // On définit les couleurs officielles de Ori Ola OBS
                'obs-dark': '#050505',
                'obs-cyan': '#00D4FF',
                'obs-magenta': '#FF00E5',
            },
            fontFamily: {
                // On lie les noms aux polices Google Fonts
                oswald: ['Oswald', ...defaultTheme.fontFamily.sans],
                inter: ['Inter', ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [],
};