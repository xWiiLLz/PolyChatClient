'use strict';
/**
 * This class represents the connected user and his infomation
 */
class User {
    constructor(name) {
        this.name = name;
        this.sentMessages = new Map();
        this.unconfirmedMessages = new Map();
        this.joinedChannels = new Map();
        this.language = 'fr';
    }

    /**
     * This function confirms a certain message was actually sent by our current user
     * @param {Message} message - the message to confirm
     */
    confirmSentMessage(message) {
        if (!this.unconfirmedMessages.has(message.channelId)) {
            return;
        }
        let messages = this.unconfirmedMessages.get(message.channelId);
        let messageIndex = messages.findIndex(x => x.sender === message.sender && x.data === message.data);

        if (messageIndex === -1) {
            return;
        }
        messages.splice(messageIndex, 1);
        this.unconfirmedMessages.set(message.channelId, messages);

        User.addMessageToMap(message, this.sentMessages);
    }

    /**
     * Adds a message to the user's sent messages Map
     * @param {Message} message - The message that was sent from this user.
     */
    addSentMessage(message) {
        User.addMessageToMap(message, this.unconfirmedMessages);
    }

    /**
     * Validates if the user has sent the message
     * @param {Message} message - the message which might have been sent by the user
     */
    hasSentMessage(message) {
        return this.sentMessages.has(message.channelId) ? this.sentMessages.get(message.channelId).findIndex(m => {
            return m.data === message.data && m.timestamp === message.timestamp;
        }) !== -1 : false;
    }

    /**
     * Adds a message from a channel to a map
     * The map could already contain messaged from this channel or not
     * @param {Message} message - The message to be added to the map
     * @param {Map} map - The map which contains the messages in their channel
     */
    static addMessageToMap(message, map) {
        let messages = [];
        if (map.has(message.channelId)) {
            messages = map.get(message.channelId);
        }
        messages.push(message);
        map.set(message.channelId, messages);
    }

    /**
     * Adds a channel to the user's joined channels
     * @param {Channel} channel - The channel to add to the list
     */
    addChannel(channel, unread = 0) {
        this.joinedChannels.set(channel.id, {channel, unread});
    }

    /**
     * Removes a channel from the user's joined channels
     * @param {Channel} channel - The channel to remove
     */
    removeChannel(channel) {
        this.joinedChannels.delete(channel.id);
    }

    /**
     * Sets the joined channels
     * @param {Map}joinedChannels - A Map with keys
     */
    setJoinedChannels(joinedChannels) {
        this.joinedChannels = joinedChannels;
    }

    /**
     * Checks whether a user has joined a given channel
     * @param {Channel} channel - The channel to check
     * @returns {boolean} - True if the user is in the channel, false if not
     */
    hasJoined(channel) {
        return this.joinedChannels.has(channel.id);
    }

    /**
     * Adds a new message to the message count of unread messages of a channel
     * @param {string} channelId - The id of the channel in which a message was received
     */
    addUnreadMessage(channelId) {
        const channelN = this.joinedChannels.get(channelId);
        if(channelN) {
            this.joinedChannels.set(channelId, {...channelN, unread:(channelN.unread + 1)})
        }
    }

    /**
     * Resets the amount of unread messaged in a channel because they have been read
     * @param {string} channelId - The id of the channel which was opened
     */
    resetUnreadMessage(channelId) {
        const channelN = this.joinedChannels.get(channelId);
        if(channelId) {
            this.joinedChannels.set(channelId, {...channelN, unread:0})
        }
    }

    /**
     * Gets the number of unread messages of the user in a specific channel
     * if the used hasn't joined the channel, the return value is 0
     * @param {string} channelId - The id of the channel in which the number of unread messages is required
     */
    getUnreadMessages(channelId) {
        const channelN = this.joinedChannels.get(channelId);
        if(channelN && channelN.unread) {
            return channelN.unread;
        }
        return 0;
    }

    /**
     * Gets the total amount of unread messages of a user in all of his joined channels
     */
    getTotalUnreadMessages() {
        let n = 0;
        this.joinedChannels.forEach((value) => {
            n += value.unread;
        });
        return n;
    }
}

/**
 * The class represents the model
 * It is composed of channels, a current channel and a user.
 */
class ChatModel {
    constructor(user, channels) {
        this.user = user;
        this.channels = channels;
        this.currentChannel = channels ? channels[0] : null;
        this.displayingStates = {
            emojiPicker: false,
            usernameChooser: true,
            usernameErrorMessage: false,
            addGroup: false,
            addGroupErrorMessage: false,
            loader: false
        };
        this.errors = [];
        const {language} = this.user;
        this.currentLanguage = polyChatLocalization[language];
    }

    /**
     *
     * @param channels - The channels to update
     * @returns {boolean} - Wheter or not the currentChannel was still valid. Useful to know if view is still in sync.
     */
    setChannels(channels) {
        if (!channels ||channels.length <= 0) {
            this.channels = [];
            return true;
        }

        // Keep the messages of the old channels
        const context = this;
        let newChannels = [];

        let currentChannelStillValid = false;

        let updatedJoinedChannels = new Map();

        channels.forEach(function(channel) {
            const {id, joinStatus, name, numberOfUsers} = channel;
            let copy = {
                id,
                messages: [],
                joinStatus,
                name,
                numberOfUsers
            };

            // We update our joinStatus with the receiving status
            if (joinStatus) {
                const unread = context.user.getUnreadMessages(channel.id);
                updatedJoinedChannels.set(channel.id, {channel, unread});
            }

            if (context.currentChannel && context.currentChannel.id === id && joinStatus) {
                currentChannelStillValid = true;
            }

            let existing = context.getChannel(channel.id);
            if (existing && existing.messages && existing.messages.length > 0) {
                copy.messages = existing.messages;
            }
            newChannels.push(copy);
        });

        // We have to display the user's joined channels first
        this.channels = [
            ...newChannels.filter(c => c.joinStatus),
            ...newChannels.filter(c => !c.joinStatus)
        ];
        this.user.setJoinedChannels(updatedJoinedChannels);

        if (!currentChannelStillValid) {
            // The channel we had selected is not valid anymore. We fall back to the first channel
            this.setCurrentChannel(this.channels[0]);
        }

        return currentChannelStillValid;
    }

    /**
     * Sets a channel depending on the information received and the previous messages saved
     * @param {Channel} channel - the new information received on the channel
     */
    setChannel(channel) {
        const {id, messages} = channel;

        if (!messages || messages.length <= 0) {
            return;
        }

        const targetedChannelIndex = this.channels.findIndex(c => c.id === id);

        if (targetedChannelIndex === -1)
            return;

        const {messages: previousMessages} = this.channels[targetedChannelIndex];
        if (!previousMessages || previousMessages.length <= 0) {
            // if there were no messages, we simple add them
            this.channels[targetedChannelIndex].messages = messages.map(m => new ChannelMessage(m));
            return;
        }
        // We received message in-between, so we need to concat the messages with the previous ones
        let uniqueMessages = new Map();
        const uniqueMessagesAdder = channelMessage => {
            if (uniqueMessages.has(channelMessage.toString()))
                return;
            uniqueMessages.set(channelMessage.toString(), channelMessage)
        };

        messages.forEach(m => uniqueMessagesAdder(new ChannelMessage(m)));
        previousMessages.forEach(cM => uniqueMessagesAdder(cM));

        this.channels[targetedChannelIndex].messages = [...uniqueMessages.values()];
    }

    /**
     * Sets the current channel
     * @param {Channel} channel - Channel to set as current
     */
    setCurrentChannel(channel) {
        const { id, messages, name } = channel;
        // We fetch messages from it if we have no history of messages yet
        if (!messages || messages.length <= 0) {
            window.connectionHandler.emit('onGetChannel', id, null);
        }

        if (!this.user.hasJoined(channel)) {
            window.chatController.joinChannel(channel);
        } else {
            this.user.resetUnreadMessage(id);
        }
        this.currentChannel = channel;


    }

    /**
     * Gets a channel from its id
     * @param {string} channelId - The id of the channel to get
     * @returns {Channel} - The channel if it exists
     */
    getChannel(channelId) {
        return this.channels.find(x => x.id === channelId);
    }

    /**
     * Adds a received message to the list of a channel
     * @param {ChannelMessage} message - The message to add to the channel
     * @param {string} channelId  - The channel id from which the message will be added to
     */
    addMessagetoChannel(message, channelId) {
        let channel = this.getChannel(channelId);
        if(channel) {
            if(!channel.messages)
                channel.messages = [];
            channel.messages.push(message);

            if (message.sender === this.user.name) {
                this.user.confirmSentMessage({...message, channelId});
            }

            if(this.currentChannel && channelId !== this.currentChannel.id) {
                this.user.addUnreadMessage(channelId);
            }
        }
    }

    /**
     * Switches the language of the application from french to english or from english to french
     */
    switchLanguage() {
        const {language} = this.user;
        this.user.language = language === 'fr' ? 'en' : 'fr';
        this.currentLanguage = window.polyChatLocalization[this.user.language];
    }
}

/**
 * The class contains a message from the websocke twhich was an 'onMessage' event. 
 * It contains only the necessary information for it's rendering.
 */
class ChannelMessage {
    /**
     * Create a message that belongs in a channel
     * @param {Message} message - The message from the server
     */
    constructor(message) {
        this.data = `<span>${sanitizeHtml(message.data, {
            allowedTags: ['img', 'ul', 'li'],
            allowedAttributes: {
                'img': ['src']
            }
        })}</span>`;
        this.sender = message.sender;
        this.timestamp = new Date(message.timestamp);
        this.channelId = message.channelId;
    }

    /**
     * Converts the message to a string
     */
    toString() {
        return `${this.data},${this.sender},${this.timestamp.toString()},${this.channelId}`;
    }
}