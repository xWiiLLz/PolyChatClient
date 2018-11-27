"use strict";

/**
 * This observer is suscribed to the event 'onMessage' from the websocket.
 * It'S role is to add the received message to the right channel
 * @param {Message} messageEvent - The message event that was received
 */
function messagesObserver(messageEvent) {
    let message = new ChannelMessage(messageEvent);
    window.chatModel.addMessagetoChannel(message, messageEvent.channelId);
    if(window.chatModel.currentChannel && window.chatModel.currentChannel.id === messageEvent.channelId)
        // We only add the message instead of re-rendering all of them since it's the currently displayed view
        window.chatController.invokeViewMethod('ChatWindow', 'renderSingleMessage', [window.chatModel, message]);
    window.chatController.renderOnly('GroupsList');
    window.chatController.renderOnly('Navigation');
}