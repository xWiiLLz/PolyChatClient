"use strict";

class VoiceObserver {
    static onPeerSignal(peerSignal) {
        const {peerConnection} = window.chatModel.user;
        if (!peerConnection) {
            return;
        }

        const {data: signal} = peerSignal;

        console.log(`Received a signal from the server: ${signal}`)

        peerConnection.signal(signal);
    }

    static onVoiceObserver(channelsEvent) {
        console.log('Got onVoice');
    }

    static onJoinVoiceObserver(onJoinVoiceEvent) {
        // We got called by a new peer in our server
    }

    static onLeaveVoiceObserver(onLeaveVoiceEvent) {

    }
}