async function startOut(pipeId, outId) {
    return await fetchResponse(
        `/control.php?streamno=${pipeId}&action=out&actnumber=${outId}&state=on`,
    );
}

async function stopOut(pipeId, outId) {
    return await fetchResponse(
        `/control.php?streamno=${pipeId}&action=out&actnumber=${outId}&state=off`,
    );
}

async function deleteOut(pipeId, outId) {
    const data = new FormData();
    data.append('rtmp_url', '');
    data.append('stream_id', pipeId);
    data.append('output_id', outId);
    data.append('resolution', '');
    data.append('name_id', '');

    return await fetchResponse('config.php?destadd', {}, data);
}

async function setOut(pipeId, outId, data) {
    const formData = new FormData();
    formData.append('rtmp_url', data.url);
    formData.append('stream_id', pipeId);
    formData.append('output_id', outId);
    formData.append('resolution', data.encoding);
    formData.append('name_id', data.name);

    return await fetchResponse('config.php?destadd', {}, formData);
}

async function setPipeName(pipeId, name) {
    const newNames = streamNames.slice();
    newNames[parseInt(pipeId)] = name;
    const namesString = newNames.slice(1).join(',');

    return await fetchResponse(
        `config.php?nameconfig`,
        { 'Content-Type': 'application/json' },
        namesString,
    );
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
