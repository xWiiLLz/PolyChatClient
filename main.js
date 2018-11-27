'use strict';
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};

const knownHosts = [
    'wss://inter-host.ca/staging',              // Notre serveur alternatif
    'ws://log2420-nginx.info.polymtl.ca'    // Serveur OFFICIEL de Polytechnique
    ];
const baseURL = knownHosts[0];

/**
 * Function that initializes the connection handler and subscribes the observers to it.
 * If the connection handler was already initialized, we make sure to re-initialize the socket
 * connection, and we re-join the already joined channels. (A change of username then preserves the state)
 * @returns {Promise<void>}
 */
window.initiateConnection = async () => {
    const {user} = window.chatModel;
    const {name} = user;
    let handler = window.connectionHandler;
    /* Cleaning of socket if already existing */
    if (handler) {
        handler.cleanSocket();
        handler.setConnectionUrl(baseURL, `chatservice?username=${name}`);
    } else {
        handler = new ConnectionHandler(baseURL, `chatservice?username=${name}`);
        handler.subscribe('updateChannelsList', ChannelsObserver.updateChannelsObserver);
        handler.subscribe('onGetChannel', ChannelsObserver.getChannelObserver);
        handler.subscribe('onMessage', messagesObserver);
        handler.subscribe('onError', errorsObserver);
        handler.subscribe('onPeerSignal', VoiceObserver.onPeerSignal);
    }

    await handler.connect().catch((e) => {
      console.error(e);
    }).finally(() => {
        window.connectionHandler = handler;
        window.chatController.render();
    });


    /* We preserve already joined channels if only changing our username */
    const {joinedChannels} = user;
    if (joinedChannels && joinedChannels.size > 0) {
        joinedChannels.forEach(channel => window.chatController.joinChannel(channel.channel));
    }

    window.chatController.render();
};

// Entry point
window.entryPoint = async () => {
    let user = new User();

    let chatModel = new ChatModel(user, []);
    let chatController = new ChatController(chatModel, []);

    let logoView = new LogoView(document.querySelector('#logoContainer'));
    logoView.onClickUpdateChannel = chatController.onClickUpdateChannel.bind(chatController);

    let navigationView = new NavigationView(document.querySelector('nav'));
    navigationView.onClickShowUsernameChooser = chatController.onClickShowUsernameChooser.bind(chatController);
    navigationView.onClickSwitchLanguage = chatController.onClickSwitchLanguage.bind(chatController);
    navigationView.onClickSignOut = chatController.onClickSignOut.bind(chatController);

    let groupsListView = new GroupsListView(document.querySelector('#groups-list'));
    groupsListView.onClickToggleChannel = chatController.onClickToggleChannel.bind(chatController);
    groupsListView.onClickSelectChannel = chatController.onClickSelectChannel.bind(chatController);
    groupsListView.onClickShowAddGroup = chatController.onClickShowAddGroup.bind(chatController);
    groupsListView.onClickToggleVocalChannel = chatController.onClickToggleVocalChannel.bind(chatController);

    let chatWindowView = new ChatWindowView(document.querySelector('#chat-window'));
    chatWindowView.onClickSendButton = chatController.onClickSendButton.bind(chatController);
    chatWindowView.onInputKeyUp = chatController.onInputKeyUp.bind(chatController);
    chatWindowView.onInputBlur = chatController.onInputBlur.bind(chatController);
    chatWindowView.onClickToggleEmojiPicker = chatController.onClickToggleEmojiPicker.bind(chatController);
    chatWindowView.onClickInsertEmoji = chatController.onClickInsertEmoji.bind(chatController);

    let usernameChooserView = new UsernameChooserView(document.querySelector('#username-chooser'));
    usernameChooserView.onClickCancelUsername = chatController.onClickCancelUsername.bind(chatController);
    usernameChooserView.onClickSubmitUsername = chatController.onClickSubmitUsername.bind(chatController);
    usernameChooserView.onUsernameKeyup = chatController.onUsernameKeyup.bind(chatController);

    let addGroupView = new AddGroupView(document.querySelector('#add-group-container'));
    addGroupView.onClickCancelAddGroup = chatController.onClickCancelAddGroup.bind(chatController);
    addGroupView.onClickAddGroup = chatController.onClickAddGroup.bind(chatController);
    addGroupView.onAddGroupKeyUp = chatController.onAddGroupKeyUp.bind(chatController);

    let errorsModalView = new ErrorsModalView(document.querySelector('#errors-container'));
    errorsModalView.onClickCloseErrorModal = chatController.onClickCloseErrorModal.bind(chatController);
    errorsModalView.onErrorModalKeyUp = chatController.onErrorModalKeyUp.bind(chatController);

    let loaderView = new LoadingView(document.querySelector('#loader-container'));

    chatController.addView(logoView);
    chatController.addView(navigationView);
    chatController.addView(groupsListView);
    chatController.addView(chatWindowView);
    chatController.addView(usernameChooserView);
    chatController.addView(addGroupView);
    chatController.addView(errorsModalView);
    chatController.addView(loaderView);

    chatController.renderOnly('UsernameChooser');

    window.chatModel = chatModel;
    window.chatController = chatController;
};

// Invoke the entry point on startup
window.entryPoint();
