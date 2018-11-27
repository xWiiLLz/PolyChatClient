'use strict';

/**
 * This class is the abstact base class of all the views.
 * It forces it's derived classes to implement the 'render' function.
 * It contains an html div container and is composed of a name.
 */
class View {
    /**
     * Creates a new view given a container
     * @param {HtmlElement} container - The container to attach to the view
     */
    constructor(container, name) {
        this.container = container;
        this.name = name;
    }

    /**
     * Renders the view
     * @param {ChatModel} model - The model from which the view fetches its data
     */
    render(model) {
        throw new Error('The render method must be implemented');
    }

    /**
     * Resets the view
     */
    reset() {
        this.container.innerHTML = '';
    }
}

/**
 * This class is the simple view of the logo at the top left of the screen.
 */
class LogoView extends View {
    constructor(container) {
        super(container, 'Logo');
        this.onClickUpdateChannel = null;
    }

    /**
     * Renders the view
     * @param {ChatModel} model 
     */
    render(model) {
        this.container.innerHTML = 
        `
            <a href="" id="logo">
                <h1>Poly&nbsp;<i class="fa fa-users"></i>&nbsp;<span>Chat</span></h1>
            </a>
        `

        const logo = this.container.querySelector('#logo');
        logo.addEventListener('click', this.onClickUpdateChannel);
    }
}

/**
 * This class is the view for the navigation at the top right of the screen
 */
class NavigationView extends View {
    /**
     * Creates a new Navigation view given a container
     * @param {HtmlElement} container - The Navigation's <nav> container to attach to the view
     */
    constructor(container) {
        super(container, 'Navigation');
        this.onClickShowUsernameChooser = null;
        this.onClickSwitchLanguage = null;
        this.onClickSignOut = null;
    }

    /**
     * Renders the Navigation view
     * @param {ChatModel} model - The model from which the view fetches its data
     */
    render(model) {
        const {currentLanguage} = model;
        const totalUnreadMessages = model.user.getTotalUnreadMessages();
        this.container.innerHTML =
            `
            <a id="change-profile" class="action-button" title="${currentLanguage['Change-profile-title']}">
                <i class="fa fa-user"></i>
                <span class="descriptor user-name">${model.user.name}</span>
            </a>
            <a class="action-button" title="${currentLanguage['Notifs-title']}">
                <span class="notifs">
                    <i class="fa fa-bell"></i>
                    ${totalUnreadMessages > 0 ? `<i class="count">${totalUnreadMessages}</i>` : ''}
                </span>
            </a>
            <a id="change-language" class="action-button" title="${currentLanguage['Change-language-title']}">
                <i class="fa fa-globe"></i>
                <span class="descriptor">
                    ${currentLanguage['Language switcher']}
                </span>
            </a>
            <a id="sign-out" class="action-button" title="${currentLanguage['Sign-out-title']}">
                <i class="fas fa-sign-out-alt"></i>
            </a>
            `;

        // Adds the event listener to change the username
        this.container.querySelector('#change-profile').addEventListener('click', this.onClickShowUsernameChooser);

        // Adds the event listener to switch the current language
        this.container.querySelector('#change-language').addEventListener('click', this.onClickSwitchLanguage);

        //  Adds the event listener to sign out
        this.container.querySelector('#sign-out').addEventListener('click', this.onClickSignOut);

        // If we have unimplemented links
        // this.container.querySelectorAll('a.unimplemented').forEach(link => link.addEventListener('click', (e) => e.preventDefault()));


        // Since this view displays the total unread messages count, it should reflect them within the title
        document.title = `${totalUnreadMessages > 0 ? `(${totalUnreadMessages}) ` : ''}PolyChat`;
        // We update the favicon
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/png';
        link.rel = 'icon';
        link.href= totalUnreadMessages > 0 ? 'favicon_active.png' : 'favicon.png';
    }
}

/**
 * This class reprensents the view of the groups at the center right of the screen
 */
class GroupsListView extends View {
    /**
     * Creates a new Navigation view given a container
     * @param {HtmlElement} container - The Navigation's <nav> container to attach to the view
     */
    constructor(container) {
        super(container, 'GroupsList');
        this.onClickToggleChannel = null;
        this.onClickSelectChannel = null;
        this.onClickShowAddGroup = null;
    }


    /**
     * Renders the GroupsList view
     * @param {ChatModel} model - The model from which the view fetches its data
     */
    render(model) {
        const {user, currentLanguage, currentChannel} = model;
        this.container.innerHTML =
            `<div class="heading">
                <p>${currentLanguage['Liste des groupes']}</p>
                <div class="flex-justify-center">
                    <h2>${currentLanguage['Groupes disponibles']}</h2>
                    <div class="icons">
                        <i id="add-group-button" class="fa fa-plus"></i>
                        <i class="fa fa-cog"></i>
                    </div>
                </div>
             </div>
             <div class="channels-container">
                ${model.channels.reduce((acc, channel, i, arr) => {
                let channelIcon;
                if (i === 0) {
                    channelIcon = 'fa-star';
                } else {
                    channelIcon = model.user.hasJoined(channel) ? 'fa-minus' : 'fa-plus';
                }

                acc += `
                        <div class="channel${i % 2 === 0 ? ' light' : ''}${i === 0 ? ' general' : ''}${channel.id === currentChannel.id ? ' current' : ''}" data-channel-id="${channel.id}">
                            <i class="fa ${channelIcon} action" data-channel-id="${channel.id}"></i>
                            <span>${channel.name}</span>
                            ${i === 0 ? `<span class="default-badge">${currentLanguage['défaut']}</span>` : ''}
                            ${user.getUnreadMessages(channel.id) !== 0 ? `<span class="notifs">
                                                                            <i class="fa fa-envelope sized"></i>
                                                                            <i class="count">${user.getUnreadMessages(channel.id)}</i>
                                                                         </span>` : ''}
                        </div>
                    `;
                return acc;
            }, '')}            
             </div>             
            `;
        let channelElements = this.container.querySelectorAll('.channel');
        channelElements.forEach(x => {
            if (!x.classList.contains('general')) {
                x.querySelector('i').addEventListener('click', this.onClickToggleChannel);
            }
            x.addEventListener('click', this.onClickSelectChannel);
        });
        this.container.querySelector('#add-group-button').addEventListener('click', this.onClickShowAddGroup);
    }
}

/**
 * This class reprensents the view of the conversation of a certain channel.
 */
class ChatWindowView extends View {
    constructor(container) {
        super(container, 'ChatWindow');
        this.onClickSendButton = null;
        this.onInputKeyUp = null;
        this.onInputBlur = null;
        this.onClickInsertEmoji = null;
        this.onClickToggleEmojiPicker = null;
    }

    /**
     * Renders the chatwindow view
     * @param {ChatModel} model - The model from which the view fetches it's data
     */
    render(model) {
        const {currentLanguage} = model;
        if(model.currentChannel) {
            const previousInput = this.container.querySelector('input[name="message"]');
            let previousValue = previousInput ? previousInput.value : null;

            let emojiCodes = [];
            for (let i = 0x1F600; i < 0x1F64F; i++) {
                emojiCodes.push(i);
            }
            this.container.innerHTML =
                `<div class="heading">
                <p>${currentLanguage['Groupe actif']}:</p>
                <h2>${model.currentChannel.name}</h2>
                </div>
             </div>
             <div class="message-scroll">
            </div>
            <div class="chat-actions-container">
                <div class="emoji-container">
                    <div class="emoji-list" tabindex="0">
                        ${emojiCodes.reduce((acc, emojiCode) => {
                    acc += `<span class="emoji">${String.fromCodePoint(emojiCode)}</span>`;
                    return acc;
                }, '')}
                    </div>
                    <a class="button emoji-picker">
                        😄
                    </a>    
                </div>
                <div class="toolbox"></div>
                <input type="text" name="message" placeholder="${currentLanguage['Input-placeholder']}" id="message-input" value="${previousValue ? previousValue : ''}">
                <a class="button like">
                    <i class="fa fa-thumbs-up"></i>
                </a>
            </div>`;

            if (model.currentChannel.messages) {
                model.currentChannel.messages.forEach(m => this.renderSingleMessage(model, m));
            }

            this.applyVisibility(model);

            let btn = this.container.querySelector('a.button.like');
            btn.addEventListener('click', this.onClickSendButton);

            let emojiToggler = this.container.querySelector('a.button.emoji-picker');
            emojiToggler.addEventListener('click', this.onClickToggleEmojiPicker);

            let emojiList = this.container.querySelector('.emoji-list');
            emojiList.addEventListener('focusout', this.onClickToggleEmojiPicker);

            let emojis = this.container.querySelectorAll('.emoji');
            emojis.forEach(x => x.addEventListener('click', this.onClickInsertEmoji));

            let input = this.container.querySelector('input[name="message"]');
            input.addEventListener('keyup', this.onInputKeyUp);
            input.addEventListener('blur', this.onInputBlur);
            input.focus();
        }
    }

    /**
     * Applies the correct visibility for certain elements of the view
     * @param {ChatModel} model - The model which allows to determine which elements should be hidden
     */
    applyVisibility(model) {
        let emojiPicker = this.container.querySelector('div.emoji-list');
        if (!emojiPicker) {
            return;
        }
        if (model.displayingStates && model.displayingStates.emojiPicker) {
            emojiPicker.classList.remove('hidden');
            emojiPicker.focus();
            return;
        }
        emojiPicker.classList.add('hidden');

    }

    /**
     * Creates a div containing a single message.
     * @param {ChatModel} model - The model to base the message on
     * @param {Message} message - The message to render.
     */
    static singleMessageElement(model, message) {
        let messageElement = document.createElement("div");

        const fromCurrentUser = message.sender === model.user.name || model.user.hasSentMessage(message);
        const fromAdmin = message.sender === 'Admin';

        messageElement.classList.add('message');
        messageElement.classList.add(fromCurrentUser ? 'user' : (fromAdmin ? 'admin' : 'other-user'));

        messageElement.innerHTML = (fromCurrentUser ? `<p class="message-bubble user">
        ` : (fromAdmin ? '<p class="admin">': `<p>${message.sender}</p>
        <p class="message-bubble other-user">
        `)) +
            `${message.data}
             </p>
             <p class="timestamp">${ChatWindowView.formatDate(message.timestamp, model)}</p>`;
        return messageElement;
    }

    /**
     * Renders a single message to the screen
     * @param {ChatModel} model - The model to base the message on
     * @param {Message} message - The message to be rendered
     */
    renderSingleMessage(model, message) {
        let messageElement = ChatWindowView.singleMessageElement(model, message);

        let messagesContainer = this.container.querySelector('.message-scroll');
        if (!messagesContainer) {
            return;
        }
        messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
    }

    /**
     * Formats a date as a string depending on the language of the user
     * @param {Date} date - The date to be formatted
     * @param {ChatModel} model - The model from ehich to get the language
     */
    static formatDate(date, model) {
        const {currentLanguage} = model;
        const hours = `${date.getHours() < 10 ? '0' : ''}${date.getHours()}`;
        const minutes = `${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;
        return `${currentLanguage['Dates'][date.getDay()]} ${date.getDate()}, ${hours}:${minutes}`;
    }
}

/**
 * This class represents the modal which allows a user to pick a name
 */
class UsernameChooserView extends View {
    constructor(container) {
        super(container, 'UsernameChooser');
        this.onClickCancelUsername = null;
        this.onClickSubmitUsername = null;
        this.onUsernameKeyup = null;
    }

    /**
     * Renders the view
     * @param {ChatModel} model - the model which contains the information to be rendered
     */
    render(model) {
        const { currentLanguage } = model;
        const originalUsername = model.user.name;
        this.container.innerHTML = `
            <div class="modal">
                <h2>${currentLanguage['Bienvenue sur PolyChat!']} 😄</h2>
                <p>${currentLanguage['Entrez votre']} ${originalUsername ? currentLanguage['nouveau nom'] : currentLanguage['nom pour continuer']} :</p>
                <input id="username-input" type="text" placeholder="${currentLanguage['Nom']}" value="${originalUsername ? originalUsername : ''}">
                <p class="error-message">${currentLanguage[`Erreur nom utilisateur`]}!</p>
                <div class="buttons">
                    ${originalUsername ? `<a class="cancel-button">${currentLanguage['Annuler']}</a>` : ''}
                    <a class="submit-button">${currentLanguage['Choisir']}</a>
                </div>
            </div>
        `;

        const input = this.container.querySelector('input#username-input');
        input.addEventListener('keyup', this.onUsernameKeyup);

        if (originalUsername) {
            let cancelBtn = this.container.querySelector('.cancel-button');
            cancelBtn.addEventListener('click', this.onClickCancelUsername);
        }

        let submitBtn = this.container.querySelector('.submit-button');
        submitBtn.addEventListener('click', this.onClickSubmitUsername);

        this.applyVisibility(model);
    }
    
    /**
     * Applies the correct visibility for certain elements of the view
     * @param {ChatModel} model - The model containing the visibility information
     */
    applyVisibility(model) {
        const {usernameChooser, usernameErrorMessage} = model.displayingStates;
        const errorContainer = this.container.querySelector('.error-message');
        const submit = this.container.querySelector('.submit-button');

        this.container.classList[usernameChooser ? 'remove' : 'add']('hidden');
        errorContainer.classList[usernameErrorMessage ? 'remove' : 'add']('hidden');
        if(usernameErrorMessage)
            submit.setAttribute('disabled', null);
        else
            submit.removeAttribute('disabled');
        
        // Focus input
        const input = this.container.querySelector('input#username-input');
        input.focus();
        if (model.user.name === input.value) {
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }
}

/**
 * This class is the view for the modal which allows a user to pick the name
 * of a group which he will then add
 */
class AddGroupView extends View {
    constructor(container) {
        super(container, 'AddGroup');
        this.onClickCancelAddGroup = null;
        this.onClickAddGroup = null;
        this.onAddGroupKeyUp = null;
    }

    /**
     * Renders the view
     * @param {ChatModel} model - The model containing the elements to render
     */
    render(model) {
        const {currentLanguage} = model;
        this.container.innerHTML = `
            <div class="modal">
                <h2>${currentLanguage['Ajouter un groupe de discussion']}</h2>
                <p>${currentLanguage['Entrez le nom du groupe']} :</p>
                <input id="add-group-input" type="text" placeholder="${currentLanguage['Nom du groupe']}">
                <p class="error-message">${currentLanguage['Erreur nom groupe']}!</p>
                <div class="buttons">
                    <a class="cancel-button">${currentLanguage['Annuler']}</a>
                    <a class="submit-button">${currentLanguage['Ajouter']}</a>
                </div>
            </div>
        `;

        const input = this.container.querySelector('input#add-group-input');
        input.addEventListener('keyup', this.onAddGroupKeyUp);


        let cancelBtn = this.container.querySelector('.cancel-button');
        cancelBtn.addEventListener('click', this.onClickCancelAddGroup);


        let submitBtn = this.container.querySelector('.submit-button');
        submitBtn.addEventListener('click', this.onClickAddGroup);

        this.applyVisibility(model);
    }

    /**
     * Applies the correct visibility for certain elements of the view
     * @param {ChatModel} model - The model containing the visibility information
     */
    applyVisibility(model) {
        const {addGroup, addGroupErrorMessage} = model.displayingStates;
        const errorContainer = this.container.querySelector('.error-message');
        const submit = this.container.querySelector('.submit-button');

        
        this.container.classList[addGroup ? 'remove' : 'add']('hidden');
        errorContainer.classList[addGroupErrorMessage ? 'remove' : 'add']('hidden');
        if(addGroupErrorMessage)
            submit.setAttribute('disabled', null);
        else
            submit.removeAttribute('disabled');

        // Focus input
        const input = this.container.querySelector('input#add-group-input');
        input.focus();
    }
}

/**
 * The view of the error model
 */
class ErrorsModalView extends View {
    constructor(container) {
        super(container, 'ErrorsModal');
        this.onClickCloseErrorModal = null;
        this.onErrorModalKeyUp = null;
    }

    /**
     * Renders the view
     * @param {ChatModel} model - The model containing the information to render 
     */
    render(model) {
        const {errors, currentLanguage} = model;
        if (!errors || errors.length <= 0)
            return this.applyVisibility(model);

        this.container.innerHTML = `
            <div class="modal">
                <i class="far fa-times-circle error-icon"></i>
                <h2>Oops!</h2>
                <p>${currentLanguage['Une erreur est survenue de la part du serveur']}</p>
                <p class="error-message">${errors[0]}</p>
                <div class="buttons">
                    <a class="close-button">Ok</a>
                </div>
            </div>
        `;

        // Map the KeyUp event
        this.container.tabIndex = 1; // Required to fire keyup events
        this.container.addEventListener('keyup', this.onErrorModalKeyUp);

        let submitBtn = this.container.querySelector('.close-button');
        submitBtn.addEventListener('click', this.onClickCloseErrorModal);

        this.applyVisibility(model);
    }
    /**
     * Applies the correct visibility for certain elements of the view
     * @param {ChatModel} model - The model containing the visibility information
     */
    applyVisibility(model) {
        const {errors} = model;
        const showModal = errors && errors.length > 0;
        this.container.classList[showModal ? 'remove' : 'add']('hidden');
        this.container.focus();
    }
}

/**
 * The view showing a loading symbol for when the app is joining the server
 */
class LoadingView extends View {
    constructor(container) {
        super(container, 'LoadingView');
    }

    /**
     * Renders the view
     * @param {ChatModel} model - The model containing the language in which to show the message 
     */
    render(model) {
        const {currentLanguage} = model;
        this.container.innerHTML = `
            <div class="modal">
                <p>${currentLanguage['Reconnecting message']}</p>
                <img src="loader.svg" />
            </div>
        `;

        this.applyVisibility(model);
    }
    
    /**
     * Applies the correct visibility for certain elements of the view
     * @param {ChatModel} model - The model containing the visibility information
     */
    applyVisibility(model) {
        const {loader} = model.displayingStates;
        this.container.classList[loader ? 'remove' : 'add']('hidden');
    }
}