"use strict";

class ChannelsObserver {
    /**
     * This observer is subscribed to the 'updateChannelsList' event from the websocket
     * Once it gets notified, its role is to update the channels list, and then asks the controller
     * to re-render
     * @param {Message} channelsEvent - The 'updateChannelsList', channels event that's coming from the server
     */
    static updateChannelsObserver(channelsEvent) {
        const channels = channelsEvent.data;

        if (!channels || channels.length <= 0) {
            return;
        }

        const shouldRerenderAll = !window.chatModel.setChannels(channels);

        if (shouldRerenderAll) {
            return window.chatController.render();
        }

        return window.chatController.renderOnly('GroupsList');
    }

    /**
     * This observer is subscribed to the 'onGetChannel' event from the websocket.
     * Once it gets called, its role is to update the messages of a specific channel,
     * then ask the controller to re-rerender.
     * @param {Message} channelEvent - The 'onGetChannel' message containing a single channel's list of messages
     */
    static getChannelObserver(channelEvent) {
        const channelDetails = channelEvent.data;
        if (!channelDetails) {
            return;
        }

        window.chatModel.setChannel(channelDetails);
        return window.chatController.renderOnly('ChatWindow');
    }
}