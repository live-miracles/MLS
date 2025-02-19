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

// ===== Document Config & URL Utils =====
function setInputValue(id, value) {
    const input = document.getElementById(id, value);
    console.assert(input !== null, 'Can\'t find element with ID "' + id + '"');
    if (input === null) {
        return;
    }

    if (input.type === 'checkbox') {
        console.assert(['0', '1'].includes(value));
        input.checked = value === '1';
    } else if (input.type === 'text' || input.type === 'number') {
        input.value = value;
    } else {
        console.error('Unknown input type: ' + input.type);
    }
}

function getConfigUrlParams() {
    const url = window.location.href;
    const searchParams = new URLSearchParams(new URL(url).search);
    const params = [];
    searchParams.forEach(function (value, key) {
        if (key === '' || !key.startsWith('__')) return;
        params.push({ key: key.substring(2), value: value });
    });
    return params;
}

function setInputElements() {
    const urlParams = getConfigUrlParams();
    urlParams.forEach((param) => setInputValue(param.key, param.value));
}

function parseDocumentConfig() {
    const params = new URLSearchParams();

    document.querySelectorAll('.url-param').forEach((input) => {
        if (input.type === 'checkbox') {
            params.append('__' + input.id, input.checked ? '1' : '0');
        } else if (input.type === 'text') {
            params.append('__' + input.id, input.value);
        } else {
            console.error('Unknown input type: ' + input.type);
        }
    });
    return params;
}

function updateUrlParams() {
    const configParams = parseDocumentConfig();
    window.history.pushState({}, '', `?${configParams.toString()}`);
}

function showElements() {
    document.querySelectorAll('.show-toggle').forEach((elem) => {
        const name = elem.id.slice('show-'.length);
        const show = elem.checked;
        document.querySelectorAll('.' + name).forEach((e) => {
            if (show) {
                e.classList.remove('hidden');
            } else {
                e.classList.add('hidden');
            }
        });
    });
}

// ===== PHP functions =====
async function submitForm(event, phpUrl, show = true) {
    const form = event.target.closest('form');
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
        hideBadConnectionAlert();
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
    const logs = document.querySelector('.logs');
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
        hideBadConnectionAlert();
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
        hideBadConnectionAlert();
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
        hideBadConnectionAlert();
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
    let stats = {
        cpu: '...',
        ram: '...',
        disk: '...',
        uplink: '...',
        downlink: '...',
    };
    let data = JSON.stringify(stats);
    try {
        const response = await fetch('/config.php?stats');
        data = await response.text();
        hideBadConnectionAlert();
    } catch (error) {
        showBadConnectionAlert();
        return stats;
    }
    try {
        stats = data === '' ? stats : JSON.parse(data);
    } catch (error) {
        showResponse(
            'Not able to parse system stats "' + escapeHTML(data.slice(0, 50)) + '": ' + error,
            true,
        );
    }
    return stats;
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

function escapeHTML(str) {
    return new Option(str).innerHTML;
}

function showBadConnectionAlert() {
    document.getElementById('badConnectionAlert').classList.remove('hidden');
}

function hideBadConnectionAlert() {
    document.getElementById('badConnectionAlert').classList.add('hidden');
}

async function updateConfigs() {
    statsJson = await fetchStats();
    processes = await fetchProcesses();

    const config = await fetchConfigFile();
    streamNames = config.names;
    streamOutsConfig = config.outs;
}

async function updateSystemStats() {
    const address = window.location.hostname;
    if (address === 'localhost') {
        return;
    }
    let stats = await fetchSystemStats();
    document.getElementById('cpu-info').innerHTML = stats.cpu;
    document.getElementById('ram-info').innerHTML = stats.ram;
    document.getElementById('disk-info').innerHTML = stats.disk;
    document.getElementById('uplink-info').innerHTML = stats.uplink;
    document.getElementById('downlink-info').innerHTML = stats.downlink;
}

// CONSTANTS
const STREAM_NUM = 25;
const OUT_NUM = 95;
const LOG_SIZE = 200;

// This will be fetched from a file
let streamNames = new Array(STREAM_NUM + 1).fill('.');
let streamOutsConfig = Array.from({ length: STREAM_NUM + 1 }, () =>
    Array.from({ length: OUT_NUM + 1 }, () => ({})),
);
let statsJson = null;
let processes = null;
