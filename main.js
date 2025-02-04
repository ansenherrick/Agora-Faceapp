//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid:'your-app_id',
    token:'your-token',
    uid:null,
    channel:'your-channel-name',
}

//#3 - Setting tracks for when user joins
let localTracks = {
    audioTrack:null,
    videoTrack:null
}

//#4 - Want to hold state for users audio and video so user can mute and hide
let localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}

//#5 - Set remote tracks to store other users
let remoteTracks = {}

let mediaRecorder;
let recordedChunks = [];
let screenResolution = `${window.screen.width}x${window.screen.height}`;
let webcamResolution = '1920x1080'; // Default, will be updated when the stream starts
let webcamFPS = 30; // Default, will be updated when the stream starts

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1920, height: 1080, frameRate: 30 }, 
        audio: true 
    });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    // Get webcam resolution and FPS
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    webcamResolution = `${settings.width}x${settings.height}`;
    webcamFPS = settings.frameRate;

    mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'webcam-recording.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Save info.txt
        const info = `Screen Resolution: ${screenResolution}\nWebcam Resolution: ${webcamResolution}\nWebcam FPS: ${webcamFPS}`;
        const infoBlob = new Blob([info], { type: 'text/plain' });
        const infoUrl = URL.createObjectURL(infoBlob);
        const infoLink = document.createElement('a');
        infoLink.href = infoUrl;
        infoLink.download = 'info.txt';
        document.body.appendChild(infoLink);
        infoLink.click();
        document.body.removeChild(infoLink);
    };
    
    mediaRecorder.start();
}

async function showPreJoinScreen() {
    startRecording();
    let overlay = document.createElement('div');
    overlay.id = 'pre-join-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'black';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontSize = '24px';
    overlay.innerText = 'Please follow the dots on the screen';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        let positions = [
            { top: '10%', left: '10%' },
            { top: '10%', right: '10%' },
            { bottom: '10%', left: '10%' },
            { bottom: '10%', right: '10%' }
        ];
        let dots = [];
        
        for (let i = 0; i < positions.length; i++) {
            let dot = document.createElement('div');
            dot.className = 'tracking-dot';
            dot.style.position = 'absolute';
            dot.style.width = '20px';
            dot.style.height = '20px';
            dot.style.backgroundColor = 'white';
            dot.style.borderRadius = '50%';
            Object.assign(dot.style, positions[i]);
            dots.push(dot);
        }
        
        let index = 0;
        function showDot() {
            if (index > 0) {
                document.body.removeChild(dots[index - 1]);
            }
            if (index < dots.length) {
                document.body.appendChild(dots[index]);
                index++;
                setTimeout(showDot, 2000);
            } else {
                setTimeout(() => {
                    dots.forEach(dot => {
                        if (document.body.contains(dot)) {
                            document.body.removeChild(dot);
                        }
                    });
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                    joinStreams();
                }, 2000);
            }
        }
        showDot();
    }, 2000);
}

document.getElementById('join-btn').addEventListener('click', async () => {
    config.uid = document.getElementById('username').value
    showPreJoinScreen()
    document.getElementById('join-wrapper').style.display = 'none'
    document.getElementById('footer').style.display = 'flex'
})

document.getElementById('mic-btn').addEventListener('click', async () => {
    if(!localTrackState.audioTrackMuted){
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true
        document.getElementById('mic-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted = false
        document.getElementById('mic-btn').style.backgroundColor ='#1f1f1f8e'
    }
})

document.getElementById('camera-btn').addEventListener('click', async () => {
    if(!localTrackState.videoTrackMuted){
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').style.backgroundColor ='#1f1f1f8e'
    }
})

document.getElementById('leave-btn').addEventListener('click', async () => {
    for (trackName in localTracks){
        let track = localTracks[trackName]
        if(track){
            track.stop()
            track.close()
            localTracks[trackName] = null
        }
    }

    await client.leave()
    document.getElementById('footer').style.display = 'none'
    document.getElementById('user-streams').innerHTML = ''
    document.getElementById('join-wrapper').style.display = 'block'

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
})

let joinStreams = async () => {
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);

    client.enableAudioVolumeIndicator();
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = './assets/volume-on.svg'
            }else{
                document.getElementById(`volume-${speaker}`).src = './assets/volume-off.svg'
            }
        }
    });

    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, config.channel, config.token ||null, config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack({
            encoderConfig: '1080p_1',
        })
    ])

    await client.publish([localTracks.audioTrack, localTracks.videoTrack])
}

let handleUserJoined = async (user, mediaType) => {
    remoteTracks[user.uid] = user
    await client.subscribe(user, mediaType)
   
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        if (player != null){
            player.remove()
        }
 
        player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`
        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
         user.videoTrack.play(`stream-${user.uid}`)
    }
    
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

let handleUserLeft = (user) => {
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`).remove()
}