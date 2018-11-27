"use strict";

class VoiceObserver {
    static onPeerSignal(peerSignal) {
        const {peerConnection} = window.chatModel.user;
        if (!peerConnection) {
            return;
        }

        const {data: signal} = peerSignal;

        peerConnection.signal(signal);
    }

    static onJoinedVoiceObserver(onJoinedVoiceEvent) {
        // We successfully joined the voice channel
        const {channelId} = onJoinedVoiceEvent;

        window.chatModel.user.vocalChannelId = channelId;

        const audioNotifs = document.getElementById('notifs-audio');
        audioNotifs.src = './sounds/on-joined-channel.mp3';
        audioNotifs.play();

        window.chatController.render();
    }
}