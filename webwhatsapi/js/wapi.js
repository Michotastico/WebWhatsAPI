/**
 * This script contains WAPI functions that need to be run in the context of the webpage
 */


if (!window.Store) {
    (function() {
        function getStore(modules) {
            let foundCount = 0;
            let neededObjects = [
                { id: "Store", conditions: (module) => (module.Chat && module.Msg) ? module : null },
                { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
                {id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.processFiles !== undefined) ? module.default : null},
                { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
                { id: "Conn", conditions: (module) => (module.default && module.default.ref && module.default.refTTL) ? module.default : null },
                { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : null },
                { id: "ProtoConstructor", conditions: (module) => (module.prototype && module.prototype.constructor.toString().indexOf('binaryProtocol deprecated version') >= 0) ? module : null },
                { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null }
            ];

            for (let idx in modules) {
                if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                    let first = Object.values(modules[idx])[0];
                    if ((typeof first === "object") && (first.exports)) {
                        for (let idx2 in modules[idx]) {
                            let module = modules(idx2);
                            if (!module) {
                                continue;
                            }

                            neededObjects.forEach((needObj) => {
                                if(!needObj.conditions || needObj.foundedModule) return;
                                let neededModule = needObj.conditions(module);
                                if(neededModule !== null) {
                                    foundCount++;
                                    needObj.foundedModule = neededModule;
                                }
                            });

                            if(foundCount == neededObjects.length) {
                                break;
                            }
                        }

                        let neededStore = neededObjects.find((needObj) => needObj.id === "Store");
                        window.Store = neededStore.foundedModule ? neededStore.foundedModule : {};
                        neededObjects.splice(neededObjects.indexOf(neededStore), 1);
                        neededObjects.forEach((needObj) => {
                            if(needObj.foundedModule) {
                                window.Store[needObj.id] = needObj.foundedModule;
                            }
                        });

                        return window.Store;
                    }
                }
            }
        }

	if (typeof webpackJsonp === 'function') {
	    webpackJsonp([], {'parasite': (x, y, z) => getStore(z)}, ['parasite']);
	} else {
	    webpackJsonp.push([
		['parasite'],
		{
		    parasite: function (o, e, t) {
			getStore(t);
		    }
		},
		[['parasite']]
	    ]);
	}
     })();
}



window.WAPI = {
    lastRead: {}
};


/**
 * Get chat models.
 * @returns {*}
 */
window.WAPI.getChatModels = function(){
    return window.Store.Chat.models || document.querySelector("#app")._reactRootContainer.current.child.child.child.child.child.child.sibling.sibling.sibling.sibling.sibling.child.child.child.child.child.sibling.sibling.sibling.sibling.sibling.child.child.child.child.memoizedState.chats;
};

/**
 * Get connection data
 * @returns {*}
 */
window.WAPI.getConn = function(){
    return window.Store.Conn || document.querySelector("#app")._reactRootContainer.current.child.child.child.child.child.memoizedProps.children[5].props.conn;
};

/**
 * Get wap functions
 * @constructor
 */
window.WAPI.GetWap = function(){
    return window.Store.Wap || {}
};


window.WAPI._serializeRawObj = (obj) => {
    if (obj) {
        return obj.toJSON();
    }
    return {}
};

/**
 * Serializes a chat object
 *
 * @param rawChat Chat object
 * @returns {{}}
 */

window.WAPI._serializeChatObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
        kind: obj.kind,
        isGroup: obj.isGroup,
        contact: obj['contact']? window.WAPI._serializeContactObj(obj['contact']): null,
        groupMetadata: obj["groupMetadata"]? window.WAPI._serializeRawObj(obj["groupMetadata"]): null,
        presence: obj["presence"]? window.WAPI._serializeRawObj(obj["presence"]):null,
        msgs: null
    });
};

window.WAPI._serializeContactObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
        formattedName: obj.formattedName,
        isHighLevelVerified: obj.__x_isHighLevelVerified,
        isMe: obj.isMe,
        isMyContact: obj.isMyContact,
        isPSA: obj.isPSA,
        isUser: obj.isUser,
        isVerified: obj.isVerified,
        isWAContact: obj.isWAContact,
        profilePicThumbObj: obj.profilePicThumb ? WAPI._serializeRawObj(obj.profilePicThumb):{},
        statusMute: obj.statusMute,
        msgs: null
    });
};

window.WAPI._serializeMessageObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    if (obj.type == 'revoked') {
        return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
        id: obj.id._serialized,
        sender: obj["senderObj"]?WAPI._serializeContactObj(obj["senderObj"]): null,
        timestamp: obj["t"],
        content: obj["body"],
        text: "caption" in obj?obj["caption"]: obj["body"],
        isGroupMsg: obj.isGroupMsg,
        isLink: obj.isLink,
        isMMS: obj.isMMS,
        isMedia: obj.isMedia,
        isNotification: obj.isNotification,
        isPSA: obj.isPSA,
        type: obj.type,
        chat: WAPI._serializeChatObj(obj['chat']),
        chatId: obj.id.remote,
        quotedMsgObj: WAPI._serializeMessageObj(obj['_quotedMsgObj']),
        mediaData: window.WAPI._serializeRawObj(obj['mediaData'])
    });
};


/**
 * Fetches all contact objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of contacts
 */
window.WAPI.getAllContacts = function (done) {
    const contacts = Store.Contact.models.map((contact) => WAPI._serializeContactObj(contact));

    if (done !== undefined) {
        done(contacts);
    } else {
        return contacts;
    }
};
/**
 * Fetches all contact objects from store, filters them
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of contacts
 */
window.WAPI.getMyContacts = function (done) {
    const contacts = Store.Contact.models.filter(d => d.__x_isMyContact === true).map((contact) => WAPI._serializeContactObj(contact));

    if (done !== undefined) {
        done(contacts);
    } else {
        return contacts;
    }
};

/**
 * Fetches contact object from store by ID
 *
 * @param id ID of contact
 * @param done Optional callback function for async execution
 * @returns {T|*} Contact object
 */
window.WAPI.getContact = function (id, done) {
    const found = Store.Contact.models.find(
        (contact) => contact.id._serialized === id
    );

    if (done !== undefined) {
        done(window.WAPI._serializeContactObj(found));
    } else {
        return window.WAPI._serializeContactObj(found);
    }
};

/**
 * Fetches all chat objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chats
 */
window.WAPI.getAllChats = function (done) {
    const chats = window.WAPI.getChatModels().map((chat) => WAPI._serializeChatObj(chat));

    if (done !== undefined) {
        done(chats);
    } else {
        return chats;
    }
};

/**
 * Fetches all chat IDs from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chat id's
 */
window.WAPI.getAllChatIds = function (done) {
    const chatIds = window.WAPI.getChatModels().map(
        (chat) => chat.id._serialized
    );

    if (done !== undefined) {
        done(chatIds);
    } else {
        return chats;
    }
};

/**
 * Fetches all groups objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chats
 */
window.WAPI.getAllGroups = function (done) {
    const groups = window.WAPI.getAllChats().filter((chat) => chat.isGroup);

    if (done !== undefined) {
        done(groups);
    } else {
        return groups;
    }
};

/**
 * Fetches chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns {T|*} Chat object
 */
window.WAPI.getChat = function (id, done) {
    const found = window.WAPI.getChatModels().find(
        (chat) => chat.id._serialized === id
    );
    if (done !== undefined) {
        done(found);
    } else {
        return found;
    }
};

window.WAPI.getChatById = function (id, done) {
    let found = window.WAPI.getChat(id);
    if (found) {
        found = WAPI._serializeChatObj(found);
    } else {
        found = false;
    }

    if (done !== undefined) {
        done(found);
    } else {
        return found;
    }
};

window.WAPI.existsChatId = function(id, done){
    let found = window.WAPI.getChat(id);
    if (found) {
        found = true;
    }
    else {
        found = false;
    }

    if (done !== undefined) {
        done(found);
    }
    return found;
};


/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns None
 */
window.WAPI.loadEarlierMessages = function (id, done) {
    const found = window.WAPI.getChatModels().find(
        (chat) => chat.id._serialized === id
    );
    if (done !== undefined) {
        found.loadEarlierMsgs().then(function(){done()});
    } else {
        found.loadEarlierMsgs();
    }
};

/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns None
 */

window.WAPI.loadAllEarlierMessages = function (id, done) {
    const found = window.WAPI.getChatModels().find(
        (chat) => chat.id._serialized === id
    );
    x = function(){
        if (!found.msgs.msgLoadState.__x_noEarlierMsgs){
            found.loadEarlierMsgs().then(x);
        } else if (done) {
            done();
        }
    };
    x();
};

window.WAPI.asyncLoadAllEarlierMessages = function (id, done) {
    done();
    window.WAPI.loadAllEarlierMessages(id);
};

window.WAPI.areAllMessagesLoaded = function (id, done) {
    const found = window.WAPI.getChatModels().find(
        (chat) => chat.id._serialized === id
    );
    if (!found.msgs.msgLoadState.__x_noEarlierMsgs) {
        if (done) {
            done(false);
        } else {
            return false
        }
    }
    if (done) {
        done(true);
    } else {
        return true
    }
};

/**
 * Load more messages in chat object from store by ID till a particular date
 *
 * @param id ID of chat
 * @param lastMessage UTC timestamp of last message to be loaded
 * @param done Optional callback function for async execution
 * @returns None
 */

window.WAPI.loadEarlierMessagesTillDate = function (id, lastMessage, done) {
    const found = window.WAPI.getChatModels().find(
        (chat) => chat.id._serialized === id
    );
    x = function(){
        if(found.msgs.models.length == 0){
            done()
        }
        else if(found.msgs.models[0].t>lastMessage){
            found.loadEarlierMsgs().then(x);
        }else {
            done();
        }
    };
    x();
};

/**
 * Load more messages in all chats from store till a particular date
 * @param lastMessage
 * @param done
 */
window.WAPI.loadEarlierMessagesTillDateAllChats = function (lastMessage, done) {
    const chats = window.WAPI.getChatModels();

    for (let chat in chats) {
        if (isNaN(chat)) {
            continue;
        }
        const currentChat = chats[chat];
        const id = currentChat.id._serialized;
        window.WAPI.loadEarlierMessagesTillDate(
            id, lastMessage, () => {}
        );
    }
    done();
};


/**
 * Fetches all group metadata objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of group metadata
 */
window.WAPI.getAllGroupMetadata = function (done) {
    const groupData = Store.GroupMetadata.models.map(
        (groupData) => groupData.toJSON()
    );

    if (done !== undefined) {
        done(groupData);
    } else {
        return groupData;
    }
};

/**
 * Fetches group metadata object from store by ID
 *
 * @param id ID of group
 * @param done Optional callback function for async execution
 * @returns {T|*} Group metadata object
 */
window.WAPI.getGroupMetadata = async function (id, done) {
    let output = Store.GroupMetadata.models.find(
        (groupData) => groupData.id._serialized === id
    );

    if (output !== undefined) {
        output = output.toJSON()
    }

    if (done !== undefined) {
        done(output);
    }
    return output;

};


/**
 * Fetches group participants
 *
 * @param id ID of group
 * @returns {Promise.<*>} Yields group metadata
 * @private
 */
window.WAPI._getGroupParticipants = async function (id) {
    const metadata = await WAPI.getGroupMetadata(id);
    return metadata.participants;
};

/**
 * Fetches IDs of group participants
 *
 * @param id ID of group
 * @param done Optional callback function for async execution
 * @returns {Promise.<Array|*>} Yields list of IDs
 */
window.WAPI.getGroupParticipantIDs = async function (id, done) {
    const output = (await WAPI._getGroupParticipants(id))
        .map((participant) => participant.id._serialized);

    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.getGroupAdmins = async function (id, done) {
    const output = (await WAPI._getGroupParticipants(id))
        .filter((participant) => participant.isAdmin)
        .map((admin) => admin.id._serialized);

    if (done !== undefined) {
        done(output);
    }
    return output;
};

/**
 * Gets object representing the logged in user
 *
 * @returns {Array|*|$q.all}
 */
window.WAPI.getMe = function (done) {
    const contacts = window.Store.Contact.models;

    const rawMe = contacts.find((contact) => contact.__x_isMe);

    if (done !== undefined) {
        done(rawMe.toJSON());
    } else {
        return rawMe.toJSON();
    }
    return rawMe.toJSON();
};

window.WAPI.processMessageObj = function (messageObj, includeMe, includeNotifications) {
    if (messageObj.isNotification) {
        if(includeNotifications)
            return WAPI._serializeMessageObj(messageObj);
        else return;
        // System message
        // (i.e. "Messages you send to this chat and calls are now secured with end-to-end encryption...")
    } else if (messageObj.id.fromMe === false || includeMe) {
        return WAPI._serializeMessageObj(messageObj);
    }
    return;
};

window.WAPI.getAllMessagesInChat = function (id, includeMe, includeNotifications, done) {
    const chat = WAPI.getChat(id);
    let output = [];
    const messages = chat.msgs.models;
    for (const i in messages) {
        if (i === "remove") {
            continue;
        }
        const messageObj = messages[i];

        let message = WAPI.processMessageObj(messageObj, includeMe, includeNotifications)
        if (message)output.push(message);
    }
    if (done !== undefined) {
        done(output);
    } else {
        return output;
    }
};

window.WAPI.getAllMessageIdsInChat = function (id, includeMe, includeNotifications, done) {
    const chat = WAPI.getChat(id);
    let output = [];
    const messages = chat.msgs.models;
    for (const i in messages) {
        if ((i === "remove")
            || (!includeMe && messages[i].isMe)
            || (!includeNotifications && messages[i].isNotification)) {
            continue;
        }
        output.push(messages[i].id._serialized);
    }
    if (done !== undefined) {
        done(output);
    } else {
        return output;
    }
};

window.WAPI.getMessageById = function (id, done) {
    try {
        Store.Msg.find(id).then((item) => done(WAPI.processMessageObj(item, true, true)))
    } catch (err) {
        done(false);
    }
};

window.WAPI.sendMessageToID = function (id, message, done) {
    try {
        var idUser = new window.Store.UserConstructor(id);
        // create new chat
        return Store.Chat.find(idUser).then((chat) => {
            if (done !== undefined) {
                chat.sendMessage(message).then(function () {
                    done(true);
                });
                return true;
            } else {
                chat.sendMessage(message);
                return true;
            }
        });
    } catch (e) {
        if (window.Store.Chat.length === 0)
            return false;

        firstChat = Store.Chat.models[0];
        var originalID = firstChat.id;
        firstChat.id = typeof originalID === "string" ? id : new window.Store.UserConstructor(id);
        if (done !== undefined) {
            firstChat.sendMessage(message).then(function () {
                firstChat.id = originalID;
                done(true);
            });
            return true;
        } else {
            firstChat.sendMessage(message);
            firstChat.id = originalID;
            return true;
        }
    }
    if (done !== undefined) done(false);
    return false;
}

window.WAPI.sendMessage = function (id, message, done) {
    const Chats = window.WAPI.getChatModels();

    for (const chat in Chats) {
        if (isNaN(chat)) {
            continue;
        }

        let temp = {};
        temp.name = Chats[chat].__x__formattedTitle;
        temp.id = Chats[chat].__x_id._serialized;
        if (temp.id === id) {
            if (done !== undefined) {
                Chats[chat].sendMessage(message).then(function () {
                    function sleep(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    }

                    var trials = 0;

                    function check() {
                        for (let i=Chats[chat].msgs.models.length - 1; i >= 0; i--) {
                            let msg = Chats[chat].msgs.models[i];

                            if (!msg.senderObj.isMe || msg.body != message) {
                                continue;
                            }
                            done(WAPI._serializeMessageObj(msg));
                            return True;
                        }
                        trials += 1;
                        console.log(trials);
                        if (trials > 30) {
                            done(true);
                            return;
                        }
                        sleep(100).then(check);
                    }
                    check();
                });
                return true;
            } else {
                Chats[chat].sendMessage(message);
                return true;
            }
        }
    }
};

window.WAPI.sendMessageAsyncAux = async function (id, message) {
    const Chats = window.WAPI.getChatModels();

    for (const chat in Chats) {
        if (isNaN(chat)) {
            continue;
        }

        let temp = {};
        temp.name = Chats[chat].__x__formattedTitle;
        temp.id = Chats[chat].__x_id._serialized;
        if (temp.id === id) {
            Chats[chat].sendMessage(message);
            return true;
        }
    }
};

window.WAPI.sendMessageAsync = function (id, message, done) {
    window.WAPI.sendMessageAsyncAux(id, message);
    done(true);
    return true;
};

window.WAPI.sendSeen = function (id, done) {
    const Chats = window.WAPI.getChatModels();

    for (const chat in Chats) {
        if (isNaN(chat)) {
            continue;
        }

        let temp = {};
        temp.name = Chats[chat].__x__formattedTitle;
        temp.id = Chats[chat].__x_id._serialized;
        if (temp.id === id) {
            if (done !== undefined) {
                Chats[chat].sendSeen(false).then(function () {
                    done(true);
                });
                return true;
            } else {
                Chats[chat].sendSeen(false);
                return true;
            }
        }
    }
    if (done !== undefined) {
        done();
    } else {
        return false;
    }
    return false;
};

window.WAPI.sendMedia = function (mediaBase64, chat_id, filename, caption, done) {
	let idUser = new window.Store.UserConstructor(chat_id);
	// create new chat
	return Store.Chat.find(idUser).then((chat) => {
	    let mediaBlob;
	    try {
            mediaBlob = window.WAPI.base64MediaToFile(mediaBase64, filename);
        }
        catch (e) {
            if (done !== undefined) done(false);
            return;
        }
        let mc = new Store.MediaCollection();
        mc.processFiles([mediaBlob], chat, 1).then(() => {
            let media = mc.models[0];
            media.sendToChat(chat, {caption: caption});
            if (done !== undefined) done(true);
        }).catch((err) => {
            if (done !== undefined) done(false);
        });
    });
};

window.WAPI.sendMediaAsync = function (
    mediaBase64, chat_id, filename, caption, url_fallback, done
) {
    window.WAPI.sendMediaAsyncAux(
        mediaBase64, chat_id, filename, caption, url_fallback
    );
    done(true);
    return true;
};

window.WAPI.sendMediaAsyncAux = async function (
    mediaBase64, chat_id, filename, caption, url_fallback
) {
	let idUser = new window.Store.UserConstructor(chat_id);
	// create new chat
	return Store.Chat.find(idUser).then((chat) => {
	    let mediaBlob;
	    try {
            mediaBlob = window.WAPI.base64MediaToFile(mediaBase64, filename);
        }
        catch (e) {
            window.WAPI.sendMessageAsyncAux(chat_id, url_fallback);
            return;
        }
        let mc = new Store.MediaCollection();
        mc.processFiles([mediaBlob], chat, 1).then(() => {
            let media = mc.models[0];
            media.sendToChat(chat, {caption: caption});
        }).catch((err) => {
            window.WAPI.sendMessageAsyncAux(chat_id, url_fallback);
        });
    });
};

window.WAPI.base64MediaToFile = function (b64Data, filename) {
    let arr = b64Data.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
};

function isChatMessage(message) {
    if (message.__x_isSentByMe) {
        return false;
    }
    if (message.__x_isNotification) {
        return false;
    }
    if (!message.__x_isUserCreatedType) {
        return false;
    }
    return true;
}

/**
 * Method to get all the visible messages on the account.
 * @param includeMe
 * @param includeNotifications
 * @param done
 * @returns {Array}
 */
window.WAPI.getAllLatestMessages = function(includeMe,
                                            includeNotifications,
                                            done) {
    const chats = window.WAPI.getChatModels();
    let output = [];
    for (let chat in chats) {
        if (isNaN(chat)) {
            continue;
        }

        let messageGroupObj = chats[chat];
        let messageGroup = WAPI._serializeChatObj(messageGroupObj);
        messageGroup.messages = [];

        const messages = messageGroupObj.msgs.models;

        // Get all messages availables to then be processed and filter the undef
        messageGroup.messages = messages.map(
            (messageObj) => WAPI.processMessageObj(
                messageObj, includeMe,  includeNotifications
            )
        ).filter(msg => msg? true : false);

        if (messageGroup.messages.length > 0) {
            output.push(messageGroup);
        }
    }
    if (done !== undefined) {
        done(output);
    }
    return output;

};

window.WAPI.getUnreadMessages = function (includeMe, includeNotifications, done) {
    const chats = window.WAPI.getChatModels();
    let output = [];
    for (let chat in chats) {
        if (isNaN(chat)) {
            continue;
        }

        let messageGroupObj = chats[chat];
        let messageGroup = WAPI._serializeChatObj(messageGroupObj);
        messageGroup.messages = [];

        const messages = messageGroupObj.msgs.models;
        for (let i = messages.length - 1; i >= 0; i--) {
            let messageObj = messages[i];
            if (messageObj.__x_isNewMsg || messageObj.__x_MustSent) {
                if(messageObj.__x_isSentByMe && !includeMe) {
                    break;
                }
                let message = WAPI.processMessageObj(messageObj, includeMe,  includeNotifications);
                if(message){
                    messageObj.__x_isNewMsg = false;
                    messageObj.__x_MustSent = false;
                    messageGroup.messages.unshift(message);
                }
            } else {
                break;
            }
        }

        if (messageGroup.messages.length > 0) {
            output.push(messageGroup);
        }
    }
    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.markDefaultUnreadMessages = function (done) {
    const chats = window.WAPI.getChatModels();
    let output = [];
    for (let chat in chats) {
        if (isNaN(chat)) {
            continue;
        }

        let messageGroupObj = chats[chat];
        let messageGroup = WAPI._serializeChatObj(messageGroupObj);
        messageGroup.messages = [];

        const messages = messageGroupObj.msgs.models;
        for (let i = messages.length - 1; i >= 0; i--) {
            let messageObj = messages[i];
            if (messageObj.__x_isSentByMe) {
                break;
            } else {
                messageObj.__x_MustSent = true;
            }
        }
    }
    if (done !== undefined) {
        done();
    }
    return true;
};

window.WAPI.getGroupOwnerID = async function (id, done) {
    let output = await WAPI.getGroupMetadata(id);
    if (output !== undefined) {
        output = output.owner._serialized;
    }
    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.getCommonGroups = async function (id, done) {
    let output = [];

    let groups = window.WAPI.getAllGroups();

    for (let groupIndex=0; groupIndex < groups.length; groupIndex++) {
        try {
            participants = await window.WAPI.getGroupParticipantIDs(
                groups[groupIndex].id._serialized
            );
            if (participants.filter((participant) => participant == id).length) {
                output.push(groups[groupIndex]);
            }
        } catch(err) {
            console.log("Error in group:");
            console.log(groups[groupIndex]);
            console.log(err);
        }
    }

    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.getBatteryLevel = function (done) {
    let output = window.WAPI.getConn().__x_battery;
    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.leaveGroup = function (groupId, done) {
    window.WAPI.GetWap().leaveGroup(groupId);
    if (done !== undefined) {
        done();
    }
    return true;
};

window.WAPI.deleteConversation = function (chatId, done) {
    let conversation = window.WAPI.getChatModels().find(
        (chat) => chat.id._serialized === chatId
    );
    let lastReceivedKey = conversation.__x_lastReceivedKey;
    window.WAPI.GetWap().sendConversationDelete(chatId, lastReceivedKey).then(
        function(response){
            if (done !== undefined) {
                done(response.status);
            }
        }
    );

    return true;
};

window.WAPI.downloadFile = function (url, done) {
    let xhr = new XMLHttpRequest();

    xhr.onload = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                let reader = new FileReader();
                reader.readAsDataURL(xhr.response);
                reader.onload =  function(e){
                    done(reader.result.substr(reader.result.indexOf(',')+1))
                };
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.open("GET", url, true);
    xhr.responseType = 'blob';
    xhr.send(null);
};

window.WAPI.getStatus = function(done){
    let bad_status = 'API-ERROR';
    try {
        let status = window.Store.Status._listeningTo.l4.__x_state;
        if (done !== undefined) {
            done(status);
        }
        return status;
    } catch (e) {
        if (done !== undefined) {
            done(bad_status);
        }
        return bad_status
    }
}; 
