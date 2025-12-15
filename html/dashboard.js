let pipelines = [];
let serverStats = {};

function msToHHMMSS(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')].join(
        ':',
    );
}

async function copyData(id) {
    const elem = document.getElementById(id);
    const text = elem.dataset.copy;
    await navigator.clipboard.writeText(text);
}

function setUrlParam(param, value) {
    const url = new URL(window.location);
    if (value === null) {
        url.searchParams.delete(param);
    } else {
        url.searchParams.set(param, value);
    }
    window.history.pushState({}, '', url);
}

function getUrlParam(param) {
    const url = new URL(window.location);
    return url.searchParams.get(param);
}

function getStatusColor(status) {
    switch (status) {
        case 'on':
            return 'green';
        case 'warning':
            return 'yellow';
        case 'error':
            return 'red';
        case 'off':
        default:
            return 'grey';
    }
}

function getServerStatsHtml() {
    return `
        <div class="stats shadow">
          <div class="stat p-3">
            <div class="stat-title">CPU</div>
            <div class="stat-value text-sm">${serverStats.cpu}</div>
          </div>
          <div class="stat p-3">
            <div class="stat-title">RAM</div>
            <div class="stat-value text-sm">${serverStats.ram}</div>
          </div>
          <div class="stat p-3">
            <div class="stat-title">Disk</div>
            <div class="stat-value text-sm">${serverStats.disk}</div>
          </div>
          <div class="stat p-3">
            <div class="stat-title">Download</div>
            <div class="stat-value text-sm">${serverStats.downlink}</div>
          </div>
          <div class="stat p-3">
            <div class="stat-title">Upload</div>
            <div class="stat-value text-sm">${serverStats.uplink}</div>
          </div>
        </div>

        <div class="divider"></div>`;
}

function renderPipelinesList(selectedPipeline) {
    document.getElementById('on-pipes').innerHTML = pipelines.filter(
        (p) => p.input.status === 'on',
    ).length;
    document.getElementById('on-outs').innerHTML = pipelines.reduce((sum, p) => {
        return sum + p.outs.filter((o) => o.status === 'on').length;
    }, 0);
    document.getElementById('out-errors').innerHTML = pipelines.reduce((sum, p) => {
        return sum + p.outs.filter((o) => o.status === 'error').length;
    }, 0);
    document.getElementById('out-warnings').innerHTML = pipelines.reduce((sum, p) => {
        return sum + p.outs.filter((o) => o.status === 'warning').length;
    }, 0);

    const html = pipelines
        .map((p) => {
            let outStatus = 'off';
            if (p.outs.some((o) => o.status === 'error')) {
                outStatus = 'error';
            } else if (p.outs.some((o) => o.status === 'warning')) {
                outStatus = 'warning';
            } else if (p.outs.some((o) => o.status === 'on')) {
                outStatus = 'on';
            }
            const style = p.id === selectedPipeline ? 'bg-base-100' : '';

            return `<li>
            <div class="flex items-center gap-2 ${style}" onclick=selectPipeline('${p.id}')>
              <div class="rounded-box h-5 w-5"
                style="background: linear-gradient(90deg, ${getStatusColor(p.input.status)}, ${getStatusColor(p.input.status)} 45%, #242933 45%, #242933 55%, ${getStatusColor(outStatus)} 55%)"></div>
              <a class="active">${p.name}</a> <div class="badge badge-sm">${p.outs.length}</div>
            </div>
          </li>`;
        })
        .join('');
    document.getElementById('pipelines').innerHTML = html;
}

function renderPipelineInfoColumn(selectedPipeline) {
    if (!selectedPipeline) {
        document.getElementById('pipe-info-col').classList.add('hidden');
        return;
    } else {
        document.getElementById('pipe-info-col').classList.remove('hidden');
    }

    document.querySelector('#pipe-info-col .server-stats').innerHTML = getServerStatsHtml();

    const pipe = pipelines.find((p) => p.id === selectedPipeline);
    document.getElementById('pipe-name').innerHTML = pipe.name;
    document.getElementById('input-time').innerHTML =
        pipe.input.time !== 0 ? msToHHMMSS(pipe.input.time) : '';

    const serverUrl = 'rtmp://' + document.location.hostname + '/distribute/';
    document.getElementById('server-url').innerHTML = serverUrl;
    document.getElementById('server-url').dataset.copy = serverUrl;
    document.getElementById('stream-key').innerHTML = pipe.key.replace('stream', 'Stream ');
    document.getElementById('stream-key').dataset.copy = pipe.key;
    document.getElementById('rtmp-url').innerHTML = serverUrl + pipe.key;
    document.getElementById('rtmp-url').dataset.copy = serverUrl + pipe.key;

    const playerElem = document.getElementById('video-player');
    const inputStatsElem = document.getElementById('input-stats');
    if (pipe.input.status === 'off') {
        playerElem.classList.add('hidden');
        inputStatsElem.classList.add('hidden');
    } else {
        playerElem.classList.remove('hidden');
        inputStatsElem.classList.remove('hidden');

        document.getElementById('input-video-codec').innerHTML = pipe.input.video.codec;
        document.getElementById('input-video-resolution').innerHTML =
            pipe.input.video.width + 'x' + pipe.input.video.height;
        document.getElementById('input-video-fps').innerHTML = pipe.input.video.fps;
        document.getElementById('input-video-level').innerHTML = pipe.input.video.level;
        document.getElementById('input-video-profile').innerHTML = pipe.input.video.profile;
        document.getElementById('input-video-bw').innerHTML = Math.trunc(
            pipe.input.video.bw / 1000,
        );

        document.getElementById('input-audio-codec').innerHTML = pipe.input.audio.codec;
        document.getElementById('input-audio-channels').innerHTML = pipe.input.audio.channels;
        document.getElementById('input-audio-sample-rate').innerHTML = pipe.input.audio.sample_rate;
        document.getElementById('input-audio-profile').innerHTML = pipe.input.audio.profile;
        document.getElementById('input-audio-bw').innerHTML = Math.trunc(
            pipe.input.audio.bw / 1000,
        );
    }
}

function renderOutsColumn(selectedPipeline) {
    if (!selectedPipeline) {
        document.getElementById('outs-col').classList.add('hidden');
        return;
    } else {
        document.getElementById('outs-col').classList.remove('hidden');
    }

    const pipe = pipelines.find((p) => p.id === selectedPipeline);
    const outsHtml = pipe.outs
        .map((o) => {
            const statusColor =
                o.status === 'on'
                    ? 'status-primary'
                    : o.status === 'warning'
                      ? 'status-warning'
                      : o.status === 'error'
                        ? 'status-error'
                        : 'status-neutral';
            return `
          <div class="bg-base-100 p-4 shadow">
            <span class="font-semibold mr-3">
              <div aria-label="status" class="status status-lg ${statusColor} mx-1"></div>
              <button class="btn btn-xs ${o.status === 'off' ? 'btn-accent' : 'btn-accent btn-outline'}"
                onclick="executePhp('/control.php?streamno=${pipe.id}&amp;action=out&amp;actnumber=${o.id}&amp;state=${o.status === 'off' ? 'on' : 'off'}')">
                ${o.status === 'off' ? 'start' : 'stop'}</button>
              Out ${o.id}: ${o.name} (${o.encoding})
              ${o.time !== 0 ? `<span class="badge badge-sm">${msToHHMMSS(o.time)}</span>` : ''}
            </span>
            <code class="text-sm opacity-70">${o.url}</code>
          </div>`;
        })
        .join('');
    document.getElementById('outputs-list').innerHTML = outsHtml;
}

function renderStatsColumn(selectedPipeline) {
    if (selectedPipeline) {
        document.getElementById('stats-col').classList.add('hidden');
        return;
    } else {
        document.getElementById('stats-col').classList.remove('hidden');
    }

    document.querySelector('#stats-col .server-stats').innerHTML = getServerStatsHtml();

    const inputStatsHtml = pipelines
        .filter((p) => p.input.video)
        .map((p) => {
            return `
      <tr class="bg-base-100">
        <th>${msToHHMMSS(p.input.time)}</th>
        <td>${p.name}</td>
        <td>${Math.trunc(p.input.video.bw / 1000)}</td>
        <td>${p.input.video.codec}</td>
        <td>${p.input.video.width}x${p.input.video.height}</td>
        <td>${p.input.video.fps}</td>
        <td>${Math.trunc(p.input.audio.bw / 1000)}</td>
        <td>${p.input.audio.codec}</td>
        <td>${p.input.audio.channels}</td>
        <td>${p.input.audio.sample_rate}</td>
      </tr>`;
        })
        .join('');
    const outputStatsHtml = pipelines
        .flatMap((p) => p.outs)
        .filter((o) => o.video)
        .map((o) => {
            return `
      <tr>
        <th>${msToHHMMSS(o.time)}</th>
        <td>${o.pipe}: ${o.name}</td>
        <td>${Math.trunc(o.video.bw / 1000)}</td>
        <td>${o.video.codec}</td>
        <td>${o.video.width}x${o.video.height}</td>
        <td>${o.video.fps}</td>
        <td>${Math.trunc(o.audio.bw / 1000)}</td>
        <td>${o.audio.codec}</td>
        <td>${o.audio.channels}</td>
        <td>${o.audio.sample_rate}</td>
      </tr>`;
        })
        .join('');
    document.getElementById('stats-table').innerHTML = inputStatsHtml + outputStatsHtml;
}

function renderPipelines() {
    const selectedPipeline = getUrlParam('pipeline');

    const gridElem = document.querySelector('.grid');
    if (selectedPipeline) {
        gridElem.classList.remove('grid-cols-[200px_1fr]');
        gridElem.classList.add('grid-cols-[200px_auto_1fr]');
    } else {
        gridElem.classList.remove('grid-cols-[200px_auto_1fr]');
        gridElem.classList.add('grid-cols-[200px_1fr]');
    }

    renderPipelinesList(selectedPipeline);
    renderPipelineInfoColumn(selectedPipeline);
    renderOutsColumn(selectedPipeline);
    renderStatsColumn(selectedPipeline);
}

function selectPipeline(id) {
    try {
        jsmpegStop();
    } catch (e) {}
    setUrlParam('pipeline', id);
    renderPipelines();
}

async function fetchServerName() {
    const res = await fetch('server-name.txt');
    const text = await res.text();
    return text.trim();
}

(async () => {
    const name = await fetchServerName();
    document.title = name + ': Dashboard';
    document.getElementById('server-name').innerHTML = 'MLS: ' + name;

    setVideoPlayers();

    await updateConfigs();
    serverStats = await fetchSystemStats();
    pipelines = getPipelinesInfo();
    renderPipelines();

    setInterval(async () => {
        await updateConfigs();
        serverStats = await fetchSystemStats();
        pipelines = getPipelinesInfo();
        renderPipelines();
    }, 500000);
})();
