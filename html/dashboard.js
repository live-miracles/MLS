let pipelines = [];
let stats = {};

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

    streamNames.forEach((name, i) => {
        if (name === '') return;

        const pipe = {
            id: String(i),
            name: name,
            key: 'stream' + i,
            input: {
                status: 'off',
                video: null,
                audio: null,
            },
            outs: [],
        };
        newPipelines.push(pipe);
    });

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

    document.getElementById('cpu-info').innerHTML = stats.cpu;
    document.getElementById('ram-info').innerHTML = stats.ram;
    document.getElementById('disk-info').innerHTML = stats.disk;
    document.getElementById('uplink-info').innerHTML = stats.uplink;
    document.getElementById('downlink-info').innerHTML = stats.downlink;

    const pipe = pipelines.find((p) => p.id === selectedPipeline);
    const pipeInfoElem = document.getElementById('pipe-info');
    if (!pipe) {
        pipeInfoElem.classList.add('hidden');
        return;
    }
    pipeInfoElem.classList.remove('hidden');
    document.getElementById('pipe-name').innerHTML = pipe.name;

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
    stats = await fetchSystemStats();
    pipelines = getPipelinesInfo();
    renderPipelines();
})();
