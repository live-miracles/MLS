let refreshTime = 5000;
let refreshIntervalId = null;

function renderStreamHeaders() {
    if (streamNames === null) {
        return;
    }
    const streams = getActiveStreams();
    let statuses = {
        distribute: Array(STREAM_NUM),
        main: Array(STREAM_NUM),
        backup: Array(STREAM_NUM),
        recording: Array(STREAM_NUM),
    };
    streams.distribute.forEach((stream) => (statuses.distribute[stream.streamId] = true));
    streams.main.forEach((stream) => (statuses.main[stream.streamId] = true));
    streams.backup.forEach((stream) => (statuses.backup[stream.streamId] = true));
    streams.recording.forEach((stream) => (statuses.recording[stream.streamId] = true));

    for (let i = 1; i <= STREAM_NUM; i++) {
        const headerElem = document.getElementById(`streamHeader${i}`);
        const streamName = streamNames[i];
        if (streamName === '') {
            document.getElementById('stream-container' + i).classList.add('hidden');
            continue;
        } else {
            document.getElementById('stream-container' + i).classList.remove('hidden');
        }
        headerElem.innerHTML = `
            <div class="mb-2 badge badge-lg bg-base-100 font-semibold">${i}</div>
            <div class="mb-2 badge ${statuses.distribute[i] ? 'badge-primary' : 'badge-outline'}">dist</div>
            <div class="badge ${statuses.main[i] ? 'badge-primary' : 'badge-outline'}">main</div>
            <div class="badge ${statuses.backup[i] ? 'badge-primary' : 'badge-outline'}">back</div>
            <span class="badge badge-lg bg-base-200 rounded-md">${streamName}</span>`;

        document.getElementById(`recording-status${i}`).className =
            `badge badge-xs ${statuses.recording[i] ? 'badge-primary' : 'badge-outline'}`;

        document.getElementById(`main-status${i}`).className =
            `badge badge-xs ${processes.includes(i + 'main') ? 'badge-primary' : 'badge-outline'}`;
        document.getElementById(`backup-status${i}`).className =
            `badge badge-xs ${processes.includes(i + 'back') ? 'badge-primary' : 'badge-outline'}`;
        document.getElementById(`video-status${i}`).className =
            `badge badge-xs ${processes.includes(i + 'video') ? 'badge-primary' : 'badge-outline'}`;
        document.getElementById(`holding-status${i}`).className =
            `badge badge-xs ${processes.includes(i + 'holding') ? 'badge-primary' : 'badge-outline'}`;
    }
}

function renderOuts() {
    const actives = getActiveOuts();
    let statuses = Array(STREAM_NUM + 1)
        .fill()
        .map((_) => []);
    actives.forEach((out) => (statuses[out.streamId][out.outId] = true));

    for (let i = 1; i <= STREAM_NUM; i++) {
        const outsDiv = document.getElementById(`stream-outs-${i}`);

        let outsHtml = '';
        const outSize = getOutSize(i);
        if (outSize === 0) {
            outsHtml += 'No configured outs...';
        }
        for (var j = 1; j <= outSize; j++) {
            let info = streamOutsConfig[i][j];
            if (isOutEmpty(info)) info = { stream: '', out: '', url: '', encoding: '', name: '' };
            const isProcRunning = processes.includes(i + 'out' + j);
            const stateClass = isProcRunning
                ? statuses[i][j]
                    ? 'badge-primary'
                    : 'badge-error'
                : 'badge-outline';
            console.assert(isProcRunning || !statuses[i][j]);

            outsHtml += `
                <div class="my-1">
                    <span class="badge badge-xs ${stateClass}"
                        id="status${i}-${j}"></span>
                    <button class="btn btn-xs btn-primary"
                        onclick="executePhp('/control.php?streamno=${i}&action=out&actnumber=${j}&state=on')">
                        on
                    </button>
                    <button class="btn btn-xs btn-error"
                        onclick="executePhp('/control.php?streamno=${i}&action=out&actnumber=${j}&state=off')">
                        off
                    </button>
                    ${info.encoding === 'source' ? '' : `<b>${capitalize(info.encoding)}</b> `}
                    Out ${j}
                    <div class="tooltip" data-tip="${info.url}">
                        <span id="destination${i}-${j}">${info.name}</span>
                    </div>
                </div>`;
        }

        outsDiv.innerHTML = outsHtml;
    }
}

function parseOutputStreamName(str) {
    const dashIndex = str.indexOf('-');
    return {
        streamId: Number(str.substring(6, dashIndex)),
        destinationName: str.substring(dashIndex + 1),
    };
}

function getActiveOuts() {
    if (statsJson === null) {
        return [];
    }
    let streams = statsJson.rtmp.server.application.find((app) => app.name['#text'] == 'output')
        .live.stream;
    if (streams === undefined) streams = []; // no streams
    if (!Array.isArray(streams)) streams = [streams]; // only one stream
    streams = streams.map((s) => s.name['#text']);

    return streams
        .map((name) => parseOutputStreamName(name))
        .map((p) => ({
            streamId: p.streamId,
            outId: streamOutsConfig[p.streamId].findIndex(
                (info) => info?.name === p.destinationName,
            ),
        }))
        .filter((p) => p.outId !== -1);
}

function extractStreamIds(streamsStats) {
    let streams = streamsStats;
    if (streams === undefined) streams = []; // no streams
    if (!Array.isArray(streams)) streams = [streams]; // only one stream

    return streams
        .map((s) => s.name['#text'])
        .map((name) => ({ streamId: Number(name.substring(6)) }));
}

function getActiveStreams() {
    if (statsJson === null) {
        return { distribute: [], main: [], backup: [], recording: [] };
    }
    let distribute = statsJson.rtmp.server.application.find(
        (app) => app.name['#text'] == 'distribute',
    ).live.stream;
    let main = statsJson.rtmp.server.application.find((app) => app.name['#text'] == 'main').live
        .stream;
    let backup = statsJson.rtmp.server.application.find((app) => app.name['#text'] == 'backup').live
        .stream;
    let recording = statsJson.rtmp.server.application.find(
        (app) => app.name['#text'] == 'recording',
    ).live.stream;

    return {
        distribute: extractStreamIds(distribute),
        main: extractStreamIds(main),
        backup: extractStreamIds(backup),
        recording: extractStreamIds(recording),
    };
}

function batchInputControlClick(isOn) {
    const inputType = document.getElementById('inputType').value;
    const streams = document
        .getElementById('batchInputControl')
        .value.split(' ')
        .map((id) => id.trim())
        .filter((id) => id !== '');
    showResponse(
        `Turning ${isOn ? 'on' : 'off'} ${inputType} input ` + `for streams ${streams.join(', ')}.`,
    );
    executePhp(
        '/control.php?batch-input-control',
        { 'Content-Type': 'application/json' },
        JSON.stringify({
            inputType: inputType,
            streams: streams,
            state: isOn ? 'on' : 'off',
        }),
    );
}

function updateRefreshTime() {
    refreshTime = Math.max(1, Number(document.getElementById('refreshTime').value)) * 1000;
    clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(rerender, refreshTime);
}

async function rerender() {
    await updateConfigs();
    renderStreamHeaders();
    renderOuts();
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

    // setVideoPlayers();
    rerender();
    updateRefreshTime();
    renderLogs();

    updateSystemStats();
    setInterval(updateSystemStats, 10000);
};
