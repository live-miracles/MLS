function startOut(pipeId, outId) {
    fetchResponse(`/control.php?streamno=${pipeId}&action=out&actnumber=${outId}&state=on`);
}

function stopOut(pipeId, outId) {
    fetchResponse(`/control.php?streamno=${pipeId}&action=out&actnumber=${outId}&state=off`);
}

function deleteOut(pipeId, outId) {
    const data = new FormData();
    data.append('rtmp_url', '');
    data.append('stream_id', pipeId);
    data.append('output_id', outId);
    data.append('resolution', '');
    data.append('name_id', '');

    fetchResponse('config.php?destadd', {}, data);
}

function setOut(pipeId, outId, data) {
    const formData = new FormData();
    formData.append('rtmp_url', data.rtmpUrl);
    formData.append('stream_id', pipeId);
    formData.append('output_id', outId);
    formData.append('resolution', data.resolution);
    formData.append('name_id', data.nameId);

    fetchResponse('config.php?destadd', {}, formData);
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

    fetchResponse('config.php?destadd', {}, data);
}

async function fetchResponse(url, headers = {}, body = undefined) {
    try {
        const response = await fetch(url, { method: 'POST', headers: headers, body: body });
        const data = await response.text();

        if (!response.ok) {
            const errorMsg = 'Request ' + url + ' failed with error: ' + data;
            showErrorAlert(errorMsg);
            return {
                error: errorMsg,
                data: null,
            };
        }
        return {
            error: null,
            data: data,
        };
    } catch (error) {
        showErrorAlert(String(error));
        return {
            error: String(error),
            data: null,
        };
    }
}
