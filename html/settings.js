function renderStreamSelectors() {
    if (streamNames === null) return;
    const streamSelectors = document.getElementsByClassName('stream-selector');

    for (let selector of streamSelectors) clearAndAddChooseOption(selector);

    for (let i = 1; i <= STREAM_NUM; i++) {
        for (let selector of streamSelectors) {
            let option = document.createElement('option');
            option.value = String(i);
            const name = streamNames[i];
            option.text = 'Stream ' + i + (name ? ': ' + name : '');
            selector.appendChild(option);
        }
    }
}

function renderOutputs() {
    const outSelector = document.getElementById('out-selector');
    clearAndAddChooseOption(outSelector);

    for (let i = 1; i <= OUT_NUM; i++) {
        let option = document.createElement('option');
        option.value = String(i);
        option.text = 'Out ' + i;
        outSelector.appendChild(option);
    }
}

function isValidUrl(str) {
    const pattern = new RegExp(
        '^([a-zA-Z]+:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', // fragment locator
        'i',
    );
    return pattern.test(str);
}

function setOutBtnClick(event) {
    const serverUrlInput = document.getElementById('server-url');
    const streamKeyInput = document.getElementById('stream-key');
    let rtmpUrl = serverUrlInput.value + streamKeyInput.value;
    if (serverUrlInput.options[serverUrlInput.selectedIndex].text === 'Instagram') {
        const queryString = streamKeyInput.value.split('?')[1];
        const params = new URLSearchParams(queryString);
        rtmpUrl = rtmpUrl.replaceAll('${s_prp}', params.get('s_prp'));
    }
    const isRtmpUrlValid = rtmpUrl === '' || isValidUrl(rtmpUrl);
    if (isRtmpUrlValid) {
        document.getElementById('rtmp-url').value = rtmpUrl;
        serverUrlInput.classList.remove('input-error');
        streamKeyInput.classList.remove('input-error');
    } else {
        serverUrlInput.classList.add('input-error');
        streamKeyInput.classList.add('input-error');
    }

    const outNameInput = document.getElementById('outName');
    const isOutNameValid = /^[a-zA-Z0-9_]*$/.test(outNameInput.value);
    if (isOutNameValid) {
        outNameInput.classList.remove('input-error');
    } else {
        outNameInput.classList.add('input-error');
    }

    if (isRtmpUrlValid & isOutNameValid) {
        submitForm(event, 'config.php?destadd');
    }
}

function renderStreamNameTable() {
    if (streamNames === null) return;
    const tableHead = document.getElementById('name-table').tHead;
    let tHeadHtml = '<tr>';
    for (let i = 1; i <= STREAM_NUM; i++) {
        tHeadHtml += `<th>Stream ${i}</th>`;
    }
    tHeadHtml += '</tr>';
    tableHead.innerHTML = tHeadHtml;

    const table = document.getElementById('name-table-body');
    let tr = table.insertRow();
    for (let i = 1; i <= STREAM_NUM; i++) {
        const td = tr.insertCell();
        const input = document.createElement('input');
        input.className = 'input input-bordered w-20 max-w-sm input-xs';
        input.type = 'text';
        input.size = '20';
        input.value = streamNames[i];
        input.name = streamNames[i];
        td.appendChild(input);
    }
}

function extractStreamNamesFromTable() {
    const table = document.getElementById('name-table');

    const names = [''];
    const row = table.rows[1];
    for (let i = 0; i < STREAM_NUM; i++) {
        const cell = row.cells[i];
        names.push(cell.firstChild.value);
    }
    return names;
}

function saveStreamNamesTable() {
    streamNames = extractStreamNamesFromTable();
    renderStreamSelectors();
    const names = streamNames.slice(1).join(',');
    executePhp(`config.php?nameconfig`, { 'Content-Type': 'application/json' }, names);
}

function bulkSetOuts() {
    const rawText = document.getElementById('bulk-outs').value;
    const outs = rawText
        .split('\n')
        .map((line) => parseOutLine(line))
        .filter((out) => !isOutEmpty(out))
        .map((out) => ({
            name_id: out.name,
            stream_id: out.stream,
            output_id: out.out,
            resolution: out.encoding,
            rtmp_url: out.url,
        }));
    showResponse('Executing bulk outs setting.');
    executePhp(`config.php?bulkset`, { 'Content-Type': 'application/json' }, JSON.stringify(outs));
}

async function resetStreamOutputs() {
    const stream = document.getElementById('reset-stream').value;
    if (stream === '') {
        return;
    }
    await updateConfigs();
    const i = Number(stream);
    const outSize = getOutSize(i);
    const outs = Array(outSize)
        .fill(0)
        .map((_, j) => ({
            name_id: '',
            stream_id: String(i),
            output_id: String(j + 1),
            resolution: '',
            rtmp_url: '',
        }));
    showResponse(`Resetting outs for stream ${i}.`);
    executePhp(
        `config.php?bulkset`,
        { 'Content-Type': 'application/json' },
        JSON.stringify(outs),
        false,
    );
}

window.onload = async function () {
    setInputElements();
    updateUrlParams();
    document
        .querySelectorAll('.url-param')
        .forEach((elem) => elem.addEventListener('change', updateUrlParams));

    showElements();
    document
        .querySelectorAll('.show-toggle')
        .forEach((elem) => elem.addEventListener('click', showElements));

    await updateConfigs();
    renderOutputs();
    renderStreamSelectors();
    renderStreamNameTable();
    renderLogs();

    updateSystemStats();
    setInterval(updateSystemStats, 10000);
};
