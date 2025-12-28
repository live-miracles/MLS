function deleteOut(pipeId, outId) {
    const data = new FormData();
    data.append('rtmp_url', '');
    data.append('stream_id', pipeId);
    data.append('output_id', outId);
    data.append('resolution', '');
    data.append('name_id', '');

    executePhp('config.php?destadd', {}, data);
}

function setOut(pipeId, outId, data) {
    const formData = new FormData();
    formData.append('rtmp_url', data.rtmpUrl);
    formData.append('stream_id', pipeId);
    formData.append('output_id', outId);
    formData.append('resolution', data.resolution);
    formData.append('name_id', data.nameId);

    executePhp('config.php?destadd', {}, formData);
}

function addOut(pipe) {
    if (!pipe) {
        console.error('Pipeline not found:', selectedPipeline);
        return;
    }

    if (pipe.outs.length >= config['out-limit']) {
        console.error(`Output limit reached. Max outputs per pipeline: ${config['out-limit']}`);
        return;
    }

    const ids = pipe.outs.map((o) => o.id);
    let newId = 1;
    while (ids.includes(String(newId))) {
        newId++;
    }

    const data = new FormData();
    data.append('rtmp_url', '');
    data.append('stream_id', pipe.id);
    data.append('output_id', String(newId));
    data.append('resolution', '');
    data.append('name_id', 'Out ' + newId);

    executePhp('config.php?destadd', {}, data);
}
