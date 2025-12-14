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
    window.canvas1 = document.getElementById('video-canvas');
    window.url1 = 'ws://' + document.location.hostname + ':443/';
    window.player1 = 'initial state';
}
