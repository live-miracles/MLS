function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
function clearAndAddChooseOption(selector) {
    removeAllChildNodes(selector);
    let option = document.createElement('option');
    option.value = '';
    option.text = 'Choose';
    selector.appendChild(option);
}

// AJAX request function
async function submitForm(formId, phpUrl, show = true) {
    const form = document.getElementById(formId);
    if (form.checkValidity()) {
        const formData = new FormData(form);
        executePhp(phpUrl, {}, formData, show);
    } else {
        form.reportValidity();
    }
}

async function executePhp(phpUrl, headers = {}, body = undefined, show = true) {
    let msg = null;
    let error = null;
    try {
        const response = await fetch(phpUrl, { method: 'POST', headers: headers, body: body });
        msg = await response.text();

        if (!response.ok) {
            error = 'Request ' + phpUrl + ' failed with status ' + response.status + msg;
        }
    } catch (error) {
        error = 'Error: ' + error;
        showBadConnectionAlert();
    }

    if (show) {
        if (error) {
            showResponse(error, true);
        } else {
            showResponse(msg);
        }
    }
}

function showResponse(value, error = false, time = Date.now()) {
    logResponse(value, error, time);
    renderResponse(value, error, time);
}

function renderResponse(value, error, time) {
    const logs = document.getElementById('logs');
    const timestamp = new Date(time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    logs.innerHTML =
        `<p class="${error ? 'text-error' : ''}">
            <span class="text-accent">[${timestamp}]</span>
            ${value}
        </p><div class="divider"></div>` + logs.innerHTML;
}

function logResponse(value, error, time) {
    const logs = localStorage.getItem('logs') ? JSON.parse(localStorage.getItem('logs')) : [];
    logs.unshift({ time: time, value: value, error: error });
    localStorage.setItem('logs', JSON.stringify(logs.slice(0, LOG_SIZE)));
}

function renderLogs() {
    const logs = localStorage.getItem('logs') ? JSON.parse(localStorage.getItem('logs')) : [];
    logs.reverse().forEach((log) => renderResponse(log.value, log.error, log.time));
}

async function fetchProcesses() {
    try {
        const response = await fetch('/config.php?proclist');
        const data = await response.text();
        const procs = data
            .replace('<pre>', '')
            .replace('\n</pre>', '')
            .replace('</pre>', '')
            .split('\n')
            .map((s) => s.split('.')[1]);
        return procs;
    } catch (error) {
        showBadConnectionAlert();
        return null;
    }
}

async function fetchStats() {
    try {
        const response = await fetch('/stat-test.xml');
        const data = await response.text();
        const parser = new DOMParser();
        const xmlData = parser.parseFromString(data, 'text/xml');
        return xml2json(xmlData);
    } catch (error) {
        showBadConnectionAlert();
        return null;
    }
}

function parseOutLine(text) {
    const matches = text.match(/^__stream(\d+)__out(\d+)__(.*)$/);
    const split = matches ? matches[3].trim().split(' ') : [];
    if (matches && split.length === 3) {
        return {
            stream: matches[1],
            out: matches[2],
            url: split[0],
            encoding: split[1],
            name: split[2],
        };
    } else {
        return {};
    }
}

function isOutEmpty(out) {
    return out?.name ? false : true;
}

function getOutSize(stream) {
    if (streamOutsConfig === null) return 0;
    const size = streamOutsConfig[stream]
        .slice(0, STREAM_NUM)
        .findLastIndex((info) => !isOutEmpty(info));
    return size === -1 ? 0 : size;
}

async function fetchConfigFile() {
    let lines = [];

    try {
        const response = await fetch('/config.txt');
        lines = (await response.text()).split('\n');
    } catch (error) {
        showBadConnectionAlert();
        return { outs: null, names: null };
    }

    let names = [];
    const outs = [];
    for (let i = 1; i <= STREAM_NUM; i++) {
        outs[i] = [];
        for (let j = 1; j <= OUT_NUM; j++) {
            outs[i][j] = {};
        }
    }

    lines
        .filter((line) => line !== '')
        .forEach((line) => {
            if (line.startsWith('__stream__name__')) {
                names = (',' + line.substring(17)).split(',');
            }
            const out = parseOutLine(line);
            if (!isOutEmpty(out)) outs[out.stream][out.out] = out;
        });

    return { outs: outs, names: names };
}

async function fetchSystemStats() {
    const defaults = {
        cpu: '',
        ram: '',
        disk: '',
        uplink: '',
        downlink: '',
    };
    try {
        const response = await fetch('/config.php?stats');
        const data = await response.text();
        if (data === '') return defaults;
        return JSON.parse(data);
    } catch (error) {
        showBadConnectionAlert();
        console.log(error);
        return defaults;
    }
}

function xml2json(xml) {
    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) {
        // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj['@attributes'] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) {
        // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof obj[nodeName] == 'undefined') {
                obj[nodeName] = xml2json(item);
            } else {
                if (typeof obj[nodeName].push == 'undefined') {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xml2json(item));
            }
        }
    }
    return obj;
}

function showBadConnectionAlert() {
    document.getElementById('badConnectionAlert').classList.remove('hidden');
}

function hideBadConnectionAlert() {
    document.getElementById('badConnectionAlert').classList.add('hidden');
}

async function updateConfigs() {
    const config = await fetchConfigFile();
    streamNames = config.names;
    streamOutsConfig = config.outs;
    statsJson = await fetchStats();
    processes = await fetchProcesses();
}

async function updateSystemStats() {
    let stats = await fetchSystemStats();
    document.getElementById('cpu-info').innerHTML = stats.cpu;
    document.getElementById('ram-info').innerHTML = stats.ram;
    document.getElementById('disk-info').innerHTML = stats.disk;
    document.getElementById('uplink-info').innerHTML = stats.uplink;
    document.getElementById('downlink-info').innerHTML = stats.downlink;
}

function toggleLogs() {
    const toggle = document.getElementById('show-logs');
    const logs = document.getElementById('logs');
    if (toggle.checked) {
        logs.classList.remove('hidden');
    } else {
        logs.classList.add('hidden');
    }
}

// CONSTANTS
const STREAM_NUM = 25;
const OUT_NUM = 95;
const LOG_SIZE = 1000;

// This will be fetched from a file
let streamNames = null;
let streamOutsConfig = null;
let statsJson = null;
let processes = null;
