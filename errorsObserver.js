"use strict";

/**
 * This observer is suscribed to the 'onError' event from the websocket
 * It's role is to render the error or the screen
 * @param {Message} errorEvent - The event containing the error message.
 */
function errorsObserver(errorEvent) {
    const {data} = errorEvent;
    if (!data || data.length <= 0)
        return;
    console.log('Received error from server : ' + errorEvent.data);
    window.chatModel.errors.push(data);
    window.chatController.render();
}