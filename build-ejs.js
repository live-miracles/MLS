const fs = require('fs');
const ejs = require('ejs');
const os = require('os');
const path = require('path');

async function getPublicIP() {
    const response = await fetch('https://api64.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
}

function buildEjs(name, data) {
    const template = fs.readFileSync(`views/${name}.ejs`, 'utf-8');
    const output = ejs.render(template, data, {
        filename: path.join(__dirname, `views/${name}.ejs`),
    });

    fs.writeFileSync(`public/${name}.html`, output);
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
