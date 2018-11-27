'use strict';

/**
 * @description ChatController, The Object that implements all of the view's events,
 * and takes care of reflecting model's changes as well as re-rendering its views.
 */
class ChatController {
    /**
     * Create a new Chat Controller
     * @param {ChatModel} model - The model to attach to the controller
     * @param {[]} views - The views to attach to the controller
     */
    constructor(model, views) {
        this.model = model;
        this.views = views ? views : [];
        this.inputIndex = 0;
    }

    /**
     * Adds a view to the controller's list
     * @param {View} view - The view to add to the list
     */
    addView(view) {
        this.views.push(view);
    }

    /**
     * Renders all of the controller's views
     */
    render() {
        this.views.forEach(view => {
            view.render(this.model);
        })
    }

    /**
     * Renders only a specific view
     * @param {string} viewName - The unique name of the targeted view
     */
    renderOnly(viewName) {
        const viewIndex = this.views.findIndex(x => x.name === viewName);
        if (viewIndex === -1) {
            return;
        }
        this.views[viewIndex].render(this.model);
    }

    /**
     * Invokes a view's method by its name with its own context (this bound to the view itself), and passes the given
     * params to it
     * @param {string} viewName - The name of the view from which the function will be invoked
     * @param {string} method - The name of the method to invoke
     * @param {object[]} params - The params to pass to the method
     */
    invokeViewMethod(viewName, method, params) {
        const viewIndex = this.views.findIndex(x => x.name === viewName);
        if (viewIndex === -1) {
            return;
        }
        const view = this.views[viewIndex];
        view[method].apply(view, params);
    }

    /**
     * Joins a channel and adds it to the user's channels
     * @param {Channel} channel - The channel to join
     */
    joinChannel(channel) {
        const {id} = channel;
        window.connectionHandler.emit('onJoinChannel', id, null);
        console.log(`Noticing server we want to join channel "${name}" with id "${id}"\n`);
    }

    /**
     * Leaves a channel and removes it from the user's channels
     * @param {Channel} channel - The channel to leave
     */
    leaveChannel(channel) {
        const {name, id} = channel;
        window.connectionHandler.emit('onLeaveChannel', id, null);
        console.log(`Noticing server we want to leave channel "${name}" with id "${id}"\n`);
    }


    /* Following are the various event handlers that are bound to the controller's views */

    /**
     * Function that gets called when clicking on a channel to show its messages
     * @param {Event} event - The click event that fired
     */
    onClickSelectChannel(event) {
        const {channelId} = event.currentTarget.dataset;
        this.model.setCurrentChannel(this.model.getChannel(channelId));
        this.render();
    }

    /**
     * Function that gets called when clicking on the plus/minus sign to join/leave a channel
     * @param {Event} event - The Click event that fired
     */
    onClickToggleChannel(event) {
        event.preventDefault();
        event.stopPropagation();

        const {channelId} = event.currentTarget.dataset;

        const channelIndex = this.model.channels.findIndex(x => x.id === channelId);
        const channel = this.model.channels[channelIndex];

        if (this.model.user.hasJoined(channel)) {
            // We want to remove the user from the channel
            this.leaveChannel(channel);
        } else {
            this.joinChannel(channel);
        }

        this.render();
    }

    onClickUpdateChannel(event) {
        event.preventDefault();
        window.connectionHandler.emit('onGetChannel', this.model.currentChannel.id, null);
        this.renderOnly('ChatWindow');
    }

    /* We define here the various functions that get bound to the views' events */

    /**
     * Event that gets triggered whenever the send/like button is clicked
     * @param event - The click event
     */
    onClickSendButton(event) {
        event.preventDefault();
        // Delegates to sendLike or sendMessage given the input value
        const input = document.querySelector('input[name="message"]');
        if (input.value && input.value.length > 0) {
            // Reset the button icon to thumbs up
            let buttonIcon = document.querySelector('.button>i.fa');

            buttonIcon.classList.remove('fa-chevron-right');
            buttonIcon.classList.add('fa-thumbs-up');
            return this.sendMessage();
        }
        return this.sendLike();

    }

    /**
     * Sends a message to the current channel, given the current state of the message input.
     */
    sendMessage() {
        const {id} = this.model.currentChannel;
        const input = document.querySelector('input[name="message"]');
        window.connectionHandler.emit('onMessage', id, input.value);
        this.model.user.addSentMessage(new Message(null, id, input.value, this.model.user.name, new Date()));
        input.value = '';
    }

    /**
     * Sends a like (thumbs-up emoji) to the current channel
     */
    sendLike() {
        const {id} = this.model.currentChannel;
        const like = String.fromCodePoint(0x1F44D);
        window.connectionHandler.emit('onMessage', id, like);
        this.model.user.addSentMessage(new Message(null, id, like, this.model.user.name, new Date()));
    }

    /**
     * Handler for input key-ups
     * @param {Event} event - The KeyUp event that fired
     */
    onInputKeyUp(event) {
        const input = document.querySelector('input[name="message"]');
        let buttonIcon = document.querySelector('.button>i.fa');

        buttonIcon.classList.remove('fa-chevron-right');
        buttonIcon.classList.add('fa-thumbs-up');
        if (input.value && input.value !== '') {
            if (event.code === 'Enter') {
                return this.onClickSendButton(event);
            }
            buttonIcon.classList.remove('fa-thumbs-up');
            buttonIcon.classList.add('fa-chevron-right');
        }
    }

    /**
     * Handler for the message input's blur. We keep track of the position of the selection, for emoji insertions
     * @param {Event} event - The blue event that fired
     */
    onInputBlur(event) {
        this.inputIndex = event.currentTarget.selectionEnd;
    }

    /**
     * Event that gets fired when clicking on the emoji button.
     * Reveals the emoji-picker panel
     * @param {Event} event - The click event that fired
     */
    onClickToggleEmojiPicker(event) {
        this.model.displayingStates.emojiPicker = !this.model.displayingStates.emojiPicker;
        this.invokeViewMethod('ChatWindow', 'applyVisibility', [this.model]);
        if (!this.model.displayingStates.emojiPicker) {
            // We restore the selection stored.
            const input = document.querySelector('input[name="message"]');
            input.focus();
            input.setSelectionRange(this.inputIndex, this.inputIndex);
        }
    }

    /**
     * Gets fired when clicking on an emoji.
     * Inserts the given emoji in the text box.
     * @param event - Click event
     */
    onClickInsertEmoji(event) {
        const input = document.querySelector('input[name="message"]');
        const emoji = event.currentTarget.innerText;
        let value = input.value;
        input.value = value.slice(0, this.inputIndex) + emoji + value.slice(this.inputIndex);
        this.inputIndex += emoji.length;

        /** We have to make sure the toggleable send/like button is set to the send icon, since
         *  the input is not empty for sure
          */
        const buttonIcon = document.querySelector('.button>i.fa');
        buttonIcon.classList.remove('fa-thumbs-up');
        buttonIcon.classList.add('fa-chevron-right');
    }

    /**
     * Toggles the display state of the username chooser
     * @param {boolean} show - True if we should display the username chooser, false if not
     */
    toggleUsernameChooser(show) {
        this.model.displayingStates.usernameChooser = show;
        this.model.displayingStates.usernameErrorMessage = false;
        this.renderOnly('UsernameChooser');
    }

    /**
     * Changes the current language, then re-renders
     */
    onClickSwitchLanguage() {
        this.model.switchLanguage();
        this.render();
    }

    /**
     * Signs out the user.
     */
    onClickSignOut() {
        window.connectionHandler.cleanSocket();
        this.views.forEach(v => v.reset());
        window.entryPoint();
    }

    /**
     * Handler to display the username chooser
     */
    onClickShowUsernameChooser() {
        this.toggleUsernameChooser(true);
    }

    /**
     * Handler to close the username chooser
     */
    onClickCancelUsername() {
        this.toggleUsernameChooser(false);
    }

    /**
     * Validates an username
     * @param {string} username - The username to validate
     * @returns {boolean} - True if the username is valid, false if not
     */
    static validateUsername(username) {
        return username && username.length >= 3 && username.length <= 15;
    }

    /**
     * Handler for submitting a new username.
     * @returns {Promise<void>}
     */
    async onClickSubmitUsername() {
        const {value} = document.body.querySelector('#username-input');

        if (!ChatController.validateUsername(value)) {
            this.model.displayingStates.usernameErrorMessage = true;
            return this.invokeViewMethod('UsernameChooser', 'applyVisibility', [this.model]);
        }

        const {name: originalUsername} = this.model.user;
        if (originalUsername && value === originalUsername) {
            return this.toggleUsernameChooser(false);
        }

        this.model.user.name = value;

        this.toggleUsernameChooser(false);
        await window.initiateConnection();
    }

    /**
     * Handler for username input's KeyUps events
     * @param {Event} event - The KeyUp event that fired
     * @returns {Promise<void>}
     */
    async onUsernameKeyup(event) {
        clearTimeout(this.usernameTimer);

        if (event.code.includes('Arrow')) {
            return;
        }

        if (event.code === 'Enter') {
            return await this.onClickSubmitUsername();
        }

        if (this.model.user.name && event.code === 'Escape') {
            return this.onClickCancelUsername();
        }

        const {value} = event.currentTarget;
        this.usernameTimer = setTimeout(() => {
            this.model.displayingStates.usernameErrorMessage = !ChatController.validateUsername(value);
            return this.invokeViewMethod('UsernameChooser', 'applyVisibility', [this.model]);
        }, 500);
    }

    /**
     * Toggles the displaying state of the AddGroup modal
     * @param {boolean} show - Whether we should display the modal or not
     */
    toggleAddGroup(show) {
        this.model.displayingStates.addGroup = show;
        this.model.displayingStates.addGroupErrorMessage = false;
        this.renderOnly('AddGroup');
    }

    /**
     * Handler for the AddGroup button's click event. This shows the AddGroup modal.
     */
    onClickShowAddGroup() {
        this.toggleAddGroup(true);
    }

    /**
     * Toggles the vocal channel of a specified channel
     */
    onClickToggleVocalChannel() {
        event.preventDefault();
        event.stopPropagation();

        const {channelId} = event.currentTarget.dataset;

        const {vocalChannelId} = this.model.user;

        if (vocalChannelId) {
            window.connectionHandler.emit('onLeaveVocalChannel', vocalChannelId, null);
            this.model.user.peerConnection = null;
        }

        let {localAudioStream} = this.model.user;

        if (vocalChannelId && vocalChannelId === channelId) {
            this.model.user.vocalChannelId = null;
            this.model.user.localAudioStream = null;
            const audioNotifs = document.getElementById('notifs-audio');
            audioNotifs.src = './sounds/on-leave-channel.mp3';
            audioNotifs.play();
            return this.render();
        }

        let context = this;
        // At this point, we want to initiate the peer connection with the server

        if(navigator.mediaDevices.getUserMedia) {
            const constraints = { audio: true, video: false};
            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                console.log('got stream');

                context.model.user.localAudioStream = stream;

                const peer = new SimplePeer({
                    initiator: true,
                    stream
                });

                peer.on('signal', (function(signal) {
                    window.connectionHandler.emit('onJoinVocalChannel', channelId, {
                        signal,
                        streamId: stream.id
                    });

                    context.model.user.vocalChannelId = channelId;
                }).bind(context));

                peer.on('connect', function() {
                    peer.send('Hey server, we\'re connected !');
                });

                peer.on('stream', function(incomingStream) {
                    let original = context.model.user.streams || [];
                    context.model.user.streams = [
                        ...original,
                        incomingStream
                    ];
                    context.renderOnly('GroupsList');
                });

                context.model.user.peerConnection = peer;
            }).catch((e) => console.error(e))
                .finally(() => this.render());
        } else {
            alert('Your browser does not support getUserMedia API');
        }
    }

    /**
     * Handler for the AddGroup's cancel click event. This hides the AddGroup modal.
     */
    onClickCancelAddGroup() {
        this.toggleAddGroup(false);
    }

    /**
     * Validates a group name
     * @param {string} name - The group name to validate
     * @returns {boolean} - Whether the group name is valid or not
     */
    static validateGroupName(name) {
        return name && name.length >= 5 && name.length <= 20;
    }

    /**
     * Handler to submit a new group to the server
     */
    onClickAddGroup() {
        const {value} = document.body.querySelector('#add-group-input');
        if (!ChatController.validateGroupName(value)) {
            this.model.displayingStates.addGroupErrorMessage = true;
            return this.invokeViewMethod('AddGroup', 'applyVisibility', [this.model]);
        }

        // Add group
        window.connectionHandler.emit('onCreateChannel', null, value);

        this.toggleAddGroup(false);
    }

    /**
     * The handler for the add group input's KeyUp events
     * @param {Event} event - The KeyUp event that fired
     * @returns {*}
     */
    onAddGroupKeyUp(event) {
        clearTimeout(this.addGroupTimer);

        if (event.code.includes('Arrow)')) {
            // Do nothing
            return;
        }

        if (event.code === 'Enter') {
            return this.onClickAddGroup();
        }

        if (event.code === 'Escape') {
            return this.onClickCancelAddGroup();
        }

        const {value} = event.currentTarget;
        this.addGroupTimer = setTimeout(() => {
            this.model.displayingStates.addGroupErrorMessage = !ChatController.validateGroupName(value);
            return this.invokeViewMethod('AddGroup', 'applyVisibility', [this.model]);
        }, 500);
    }

    /**
     * The handler for the error-modal cancel button's click event
     */
    onClickCloseErrorModal() {
        this.model.errors = this.model.errors.slice(1);
        return this.render();
    }

    /**
     * The handler for the error modal's KeyUp events
     * @param {Event} event - The KeyUp event that fired
     * @returns {*}
     */
    onErrorModalKeyUp(event) {
        const {code} = event;
        if (!code) {
            // Do nothing
            return;
        }

        if (code === 'Enter' || code === 'Escape') {
            return this.onClickCloseErrorModal();
        }
    }
}
