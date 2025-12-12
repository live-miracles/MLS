let pipelines = [];

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

function getPipelinesConfig() {
    const newPipelines = [];

    streamNames.forEach((name, i) => {
        if (name === '') return;

        const pipe = {
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

(async () => {
    await updateConfigs();
    pipelines = getPipelinesConfig();
})();
