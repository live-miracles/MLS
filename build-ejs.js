const fs = require('fs');
const ejs = require('ejs');
const os = require('os');
const path = require('path');
const { minify } = require('html-minifier');

async function getPublicIP() {
    const response = await fetch('https://api64.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
}

function buildEjs(name, data) {
    const template = fs.readFileSync(`views/${name}.ejs`, 'utf-8');
    const rawHtml = ejs.render(template, data, {
        filename: path.join(__dirname, `views/${name}.ejs`),
    });

    const minifiedHtml = minify(rawHtml, {
        collapseWhitespace: true,
        removeComments: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true
    });

    fs.writeFileSync(`public/${name}.html`, minifiedHtml);
    console.log(`Static HTML generated: public/${name}.html`);
}

(async () => {
    const data = {
        hostname: os.hostname(),
        publicIp: await getPublicIP(),
        STREAM_NUM: 25,
        OUT_NUM: 95,
    };

    console.log(data);
    buildEjs('index', data);
})();
