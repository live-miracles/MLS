function playVideo(url) {
    const streamId = getUrlParam('pipeline');
    if (!streamId) {
        alert('No pipeline selected');
        return;
    }
    url += streamId;
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            jsmpegPlay();
        }
    };
    xhttp.open('GET', url, true);
    xhttp.send();
}

function jsmpegPlay() {
    const playerControlsElem = document.getElementById('player-controls');
    playerControlsElem.parentElement.insertBefore(canvas1, playerControlsElem);
    if (player1 == 'initial state') {
        player1 = new JSMpeg.Player(url1, {
            canvas: canvas1,
            autoplay: false,
            pauseWhenHidden: false,
            videoBufferSize: 100 * 1024,
            audioBufferSize: 50 * 1024,
        });
    }
    player1.play();
    player1.volume = 1;
    return false;
}

function jsmpegStop() {
    player1.stop();
    return false;
}

function jsmpegVolumeup() {
    player1.volume = player1.volume + 0.2;
    return false;
}

function jsmpegVolumedown() {
    player1.volume = player1.volume - 0.2;
    if (player1.volume < 0) {
        player1.volume = 0;
    }
    return false;
}

function setVideoPlayers() {
    for (let i = 1; i <= STREAM_NUM; i++) {
        for (let j = 1; j <= OUT_NUM; j++) {
            eval(`window.canvas${i} = document.getElementById('video-canvas${i}');`);
            eval(`window.url${i} = 'ws://' + document.location.hostname + ':443/';`);
            eval(`window.player${i} = 'initial state';`);
        }
    }
}
