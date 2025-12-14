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
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

function getUrlParam(param) {
    const url = new URL(window.location);
    return url.searchParams.get(param);
}

function getRtmpStats(type) {
    if (statsJson === null) {
        return [];
    }
    let outputs = statsJson.rtmp.server.application.find((app) => app.name['#text'] == type).live
        .stream;
    if (outputs === undefined) outputs = []; // no streams
    if (!Array.isArray(outputs)) outputs = [outputs]; // only one stream

    return outputs.map((s) => {
        const streamNo = s.name['#text'].split('-')[0].replace('stream', '');
        const name = s.name['#text'].split('-')[1];
        const id =
            type === 'output'
                ? streamOutsConfig[parseInt(streamNo)].find((o) => o && o.name === name).out
                : null;

        return {
            id: id,
            input: streamNo,
            time: parseInt(s.time['#text']),
            video: {
                codec: s.meta.video.codec['#text'],
                fps: s.meta.video.frame_rate['#text'],
                height: s.meta.video.height['#text'],
                width: s.meta.video.width['#text'],
                level: s.meta.video.level['#text'],
                profile: s.meta.video.profile['#text'],
                bw: s.bw_video['#text'],
            },
            audio: {
                codec: s.meta.audio.codec['#text'],
                profile: s.meta.audio.profile['#text'],
                channels: s.meta.audio.channels['#text'],
                sample_rate: s.meta.audio.sample_rate['#text'],
                bw: s.bw_audio['#text'],
            },
        };
    });
}

function getPipelinesInfo() {
    const newPipelines = [];

    if (streamNames === null) {
        streamNames = [];
    }
    streamNames.forEach((name, i) => {
        if (name === '') return;

        const pipe = {
            id: String(i),
            name: name,
            key: 'stream' + i,
            input: {
                status: 'off',
                time: 0,
                video: null,
                audio: null,
            },
            outs: [],
        };
        newPipelines.push(pipe);
    });

    if (streamOutsConfig === null) {
        streamOutsConfig = [];
    }
    streamOutsConfig.forEach((outConfig, i) => {
        outConfig.forEach((out, i) => {
            if (Object.keys(out).length === 0) return;

            const pipe = newPipelines.find((p) => p.key === 'stream' + out.stream);
            if (!pipe) return;
            const status = processes.includes(i + 'out' + out.out) ? 'error' : 'off';

            pipe.outs.push({
                id: out.out,
                name: out.name,
                encoding: out.encoding,
                url: out.url,
                status: status,
                time: 0,
                video: null,
                audio: null,
            });
        });
    });

    getRtmpStats('output').forEach((s) => {
        const pipe = newPipelines.find((p) => p.key === 'stream' + s.input);
        if (!pipe) {
            console.error('Pipeline not found for stats', s);
            return;
        }

        const out = pipe.outs.find((o) => o.id === s.id);
        if (!out) {
            console.error('Output not found for stats', s);
            return;
        }

        out.status = s.video.bw > 0 ? 'on' : 'warning';
        out.time = s.time;
        out.video = s.video;
        out.audio = s.audio;
    });

    getRtmpStats('distribute').forEach((s) => {
        const pipe = newPipelines.find((p) => p.key === 'stream' + s.input);
        if (!pipe) {
            console.error('Pipeline not found for stats', s);
            return;
        }

        pipe.input = {
            status: s.video.bw > 0 ? 'on' : 'warning',
            time: s.time,
            video: s.video,
            audio: s.audio,
        };
    });

    return newPipelines;
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

function renderPipelines() {
    const selectedPipeline = getUrlParam('pipeline');

    // Render pipeline list
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

    document.getElementById('cpu-info').innerHTML = serverStats.cpu;
    document.getElementById('ram-info').innerHTML = serverStats.ram;
    document.getElementById('disk-info').innerHTML = serverStats.disk;
    document.getElementById('uplink-info').innerHTML = serverStats.uplink;
    document.getElementById('downlink-info').innerHTML = serverStats.downlink;

    // Render selected pipeline info
    const pipe = pipelines.find((p) => p.id === selectedPipeline);
    const pipeInfoElem = document.getElementById('pipe-info');
    if (!pipe) {
        pipeInfoElem.classList.add('hidden');
        return;
    }
    pipeInfoElem.classList.remove('hidden');
    document.getElementById('pipe-name').innerHTML = pipe.name;
    document.getElementById('input-time').innerHTML = msToHHMMSS(pipe.input.time);
    document.getElementById('server-url').innerHTML =
        'rtmp://' + document.location.hostname + '/distribute/';
    document.getElementById('server-url').dataset.copy =
        'rtmp://' + document.location.hostname + '/distribute/';
    document.getElementById('stream-key').innerHTML = pipe.key.replace('stream', 'Stream ');
    document.getElementById('stream-key').dataset.copy = pipe.key;

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

function selectPipeline(id) {
    setUrlParam('pipeline', id);
    renderPipelines();
}

(async () => {
    await updateConfigs();
    serverStats = await fetchSystemStats();
    pipelines = getPipelinesInfo();
    renderPipelines();

    setInterval(async () => {
        await updateConfigs();
        serverStats = await fetchSystemStats();
        pipelines = getPipelinesInfo();
        renderPipelines();
    }, 5000);
})();
