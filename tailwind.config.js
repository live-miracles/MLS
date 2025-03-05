/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./public/**/*.{html,js}', './views/*.ejs'],
    theme: {
        extend: {},
    },
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
    daisyui: {
        themes: ['dim', 'night'],
    },
};
