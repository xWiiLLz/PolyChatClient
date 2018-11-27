'use strict';

class Observable {
    /**
     * Creates a new Observable object.
     */
    constructor() {
        this.observers = [];
    }

    /**
     * Adds and observer to the observable.
     * @param {function} observer - The callback function to be called when the observable emits a message
     */
    addObserver(observer) {
        this.observers.push(observer);
    }

    /**
     * Removes an observer from the observable
     * @param observer
     */
    removeObserver(observer) {
        let i = this.observers.indexOf(observer);
        if (i !== -1) {
            this.observers.splice(i, 1);
        }
    }

    /**
     * Notifies every observer with the given message
     * @param message
     */
    notifyObservers(message) {
        this.observers.forEach(observer => {
            observer(message);
        });
    }
}

/**
 * @description ConnectionHandler, The Object that handles the back and forth communications with the server via WebSockets
 */
class ConnectionHandler {
    /**
     * Creates a new ConnectionHandler.
     * @param {string} baseUrl - The baseUrl of the WebSocket endpoint, without the last forward slack ('/')
     * @param {string} queryParams - The query params for the WebSocket endpoint.
     *                               With the original implementation of the server, that's where we would give the
     *                               Username value. (Example: 'chatservice?username=my-username'
     */
    constructor(baseUrl, queryParams) {
        this.connectionUrl = `${baseUrl}/${queryParams}`;
        this.supportedEvents = new Map([
            ["onMessage", new Observable()],
            ["onGetChannel", new Observable()],
            ["onCreateChannel", new Observable()],
            ["onJoinChannel", new Observable()],
            ["onLeaveChannel", new Observable()],
            ["updateChannelsList", new Observable()],
            ["onError", new Observable()]
        ]);
        this.socket = null;
    }

    /**
     * Sets the connection url to a new value. Useful for reconnecting to a different server or to change username
     * after the instance has been created.
     * @param {string} baseUrl - The baseUrl of the WebSocket endpoint, without the last forward slack ('/')
     * @param {string} queryParams - The query params for the WebSocket endpoint.
     *                               With the original implementation of the server, that's where we would give the
     *                               Username value. (Example: 'chatservice?username=my-username'
     */
    setConnectionUrl(baseUrl, queryParams) {
        this.connectionUrl = `${baseUrl}/${queryParams}`;
    }

    /**
     * Initiates the WebSocket connection.
     */
    connect() {
        window.chatModel.displayingStates.loader = true;
        window.chatController.renderOnly('LoadingView');
        const context = this;
        return new Promise(function (resolve, reject) {
            try {
                context.socket = new WebSocket(context.connectionUrl);
            } catch (e) {
                console.count(e);
            }

            context.socket.onopen = function () {
                window.chatModel.displayingStates.loader = false;
                window.chatController.renderOnly('LoadingView');
                resolve(context.socket);
            };

            context.socket.onmessage = function (serializedEvent) {
                let event = JSON.parse(serializedEvent.data);

                const targetedEvent = context.supportedEvents.get(event.eventType);

                if (!targetedEvent) {
                    console.error(`Event ${event.eventType} was triggered, but is not in the supportedEvents!`);
                    return;
                }

                targetedEvent.notifyObservers(event);
            };

            context.socket.onclose = async function (event) {
                // The server ended the connection on purpose if the code is different than 1006 (Abnormal Closure)
                if (event.code !== 1006) {
                    // Normal terminaison by server, we won't try to reconnect
                    context.cleanSocket();
                    return;
                }
                console.count('Socket connection dropped unexpectedly. Attempting to reconnect...');

                resolve(context.connect());
            };

            context.socket.onerror = function () {
                // The onclose event will take care of further reconnection attempts.
                console.count(`Socket error occured.`);
            }
        });
    }

    /**
     * Cleans the socket connection event handlers, and makes sure it is closed.
     */
    cleanSocket() {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.close(1000);
    }

    /**
     * Emits a message to the web socket. This function will debounce until the message was successfully sent.
     * If an error occurs with the socket, the debounce will let the reconnecting logic of the 'onclose' socket event
     * try to reconnect.
     * @param {string} eventType - The type of the event to send
     * @param {string} channelId - The Id of the channel to target
     * @param {object} data - The message's payload
     */
    async emit(eventType, channelId, data) {
        const message = {eventType, channelId, data};

        if (this.socket.readyState !== WebSocket.CONNECTING) {
            try {
                this.socket.send(JSON.stringify(message));
                return;
            } catch (e) {
                console.error(`An error occured while trying to send the message... trying to reconnect the socket. Error details: ${e}`);
            }
        }
        setTimeout(this.emit(eventType, channelId, data), 500);
    }

    /**
     * Subscribe to an event
     * @param {string} eventType - The type of the event to subscribe to
     * @param {function} fn - A callback function that gets triggered with event's message upon reception
     */
    subscribe(eventType, fn) {
        if (!this.supportedEvents.has(eventType)) {
            console.error(`The event ${eventType} is not supported.`);
            return;
        }

        this.supportedEvents.get(eventType).addObserver(fn);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventType - The type of the event to subscribe to
     * @param {function} fn - The previously subscribed callback function to unbind from the observable
     */
    unsubscribe(eventType, fn) {
        if (!this.supportedEvents.has(eventType)) {
            console.error(`The event ${eventType} is not supported.`);
            return;
        }

        this.supportedEvents.get(eventType).removeObserver(fn);
    }
}