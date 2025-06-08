const userCommandSpamCounters = new Map();
const userSpamCounters = new Map();

// Configurazioni
const LIMITS = {
    COMMAND: 5,         // Max comandi in 5 secondi
    STICKER: 6,         // Max sticker in 5 secondi
    MEDIA: 3,           // Max foto/video in 5 secondi
    TAG_ALL: 1,         // Max @all/@everyone
    RESET_TIMEOUT: 5000 // 5 secondi
};

const PUNISHMENTS = {
    BAN_DURATION: 3600000, // 1 ora in ms
    TEMP_RESTRICT: true    // Restrizione temporanea del gruppo
};

export async function before(m, { isAdmin, isBotAdmin, conn }) {
    // Filtri iniziali
    if (m.isBaileys && m.fromMe) return true;
    if (!m.isGroup) return false;

    const { chat, sender, isOwner } = initializeContext(m);
    const { isCommand, isSticker, isMedia, isMassTag } = checkMessageType(m);

    // Gestione anti-spam comandi
    if (chat.antispamcomandi && !isOwner && isCommand) {
        await handleCommandSpam(m, { chat, sender, isBotAdmin, conn });
    }

    // Gestione anti-spam generale
    if (!isOwner && (isSticker || isMedia || isMassTag)) {
        await handleGeneralSpam(m, { chat, sender, isAdmin, isBotAdmin, conn });
    }

    return true;
}

// Funzioni di supporto
function initializeContext(m) {
    const chat = global.db.data.chats[m.chat] || {};
    const sender = m.sender;
    const isOwner = global.owner.map(([number]) => `${number}@s.whatsapp.net`).includes(sender);
    
    return { chat, sender, isOwner };
}

function checkMessageType(m) {
    return {
        isCommand: m.text?.startsWith('.'),
        isSticker: Boolean(m.message?.stickerMessage),
        isMedia: Boolean(m.message?.imageMessage || m.message?.videoMessage),
        isMassTag: Boolean(
            m.message?.extendedTextMessage?.text?.includes('@all') || 
            m.message?.extendedTextMessage?.text?.includes('@everyone')
        )
    };
}

async function handleCommandSpam(m, { chat, sender, isBotAdmin, conn }) {
    if (!userCommandSpamCounters.has(chat.id)) {
        userCommandSpamCounters.set(chat.id, new Map());
    }

    const chatCounters = userCommandSpamCounters.get(chat.id);
    const userCounter = chatCounters.get(sender) || { count: 0, timer: null };

    // Aggiorna contatore
    userCounter.count++;
    if (userCounter.timer) clearTimeout(userCounter.timer);

    // Controlla limite
    if (userCounter.count > LIMITS.COMMAND) {
        if (isBotAdmin) {
            await punishUser(m, sender, conn, 'comando');
        }
        chatCounters.delete(sender);
        return;
    }

    // Imposta timer di reset
    userCounter.timer = setTimeout(() => {
        chatCounters.delete(sender);
        if (chatCounters.size === 0) {
            userCommandSpamCounters.delete(chat.id);
        }
    }, LIMITS.RESET_TIMEOUT);

    chatCounters.set(sender, userCounter);
}

async function handleGeneralSpam(m, { chat, sender, isAdmin, isBotAdmin, conn }) {
    if (!userSpamCounters.has(chat.id)) {
        userSpamCounters.set(chat.id, new Map());
    }

    const chatCounters = userSpamCounters.get(chat.id);
    const userCounter = chatCounters.get(sender) || { 
        sticker: 0, 
        media: 0, 
        tags: 0, 
        messages: [], 
        timer: null 
    };

    // Aggiorna contatori
    if (m.message?.stickerMessage) userCounter.sticker++;
    if (m.message?.imageMessage || m.message?.videoMessage) userCounter.media++;
    if (m.message?.extendedTextMessage?.text?.includes('@all')) userCounter.tags++;
    
    userCounter.messages.push(m.key);
    if (userCounter.timer) clearTimeout(userCounter.timer);

    // Controlla limiti
    const isSpamming = 
        userCounter.sticker > LIMITS.STICKER ||
        userCounter.media > LIMITS.MEDIA ||
        userCounter.tags > LIMITS.TAG_ALL;

    if (isSpamming && isBotAdmin) {
        await punishUser(m, sender, conn, 'generale');
        chatCounters.delete(sender);
        return;
    }

    // Imposta timer di reset
    userCounter.timer = setTimeout(() => {
        chatCounters.delete(sender);
        if (chatCounters.size === 0) {
            userSpamCounters.delete(chat.id);
        }
    }, LIMITS.RESET_TIMEOUT);

    chatCounters.set(sender, userCounter);
}

async function punishUser(m, sender, conn, type) {
    try {
        // 1. Rimuovi l'utente
        await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
        
        // 2. Elimina tutti i messaggi di spam
        const userCounter = userSpamCounters.get(m.chat)?.get(sender);
        if (userCounter?.messages) {
            await Promise.all(
                userCounter.messages.map(msg => 
                    conn.sendMessage(m.chat, { 
                        delete: { ...msg, fromMe: false }
                    }).catch(console.error)
                )
            );
        }

        // 3. Notifica il gruppo
        await conn.sendMessage(m.chat, { 
            text: `*ANTI-SPAM ${type.toUpperCase()}*\n@${sender.split('@')[0]} è stato rimosso per spam.`,
            mentions: [sender]
        });

        // 4. Programma sban automatico
        setTimeout(async () => {
            await conn.groupParticipantsUpdate(m.chat, [sender], 'add');
            await conn.sendMessage(m.chat, {
                text: `*BAN CONCLUSO*\n@${sender.split('@')[0]} può ora rientrare nel gruppo.`,
                mentions: [sender]
            });
        }, PUNISHMENTS.BAN_DURATION);

        // 5. Temporanea restrizione gruppo (opzionale)
        if (PUNISHMENTS.TEMP_RESTRICT) {
            await conn.groupSettingUpdate(m.chat, 'announcement');
            setTimeout(() => 
                conn.groupSettingUpdate(m.chat, 'not_announcement'), 
                30000
            );
        }
    } catch (error) {
        console.error('Errore nella punizione:', error);
    }
}