const userCommandSpamCounters = new Map();

// Configurazioni
const LIMITS = {
    COMMAND: 5,         // Max comandi in 5 secondi
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

    const chat = global.db.data.chats[m.chat] || {};
    const sender = m.sender;
    const isOwner = global.owner.map(([number]) => `${number}@s.whatsapp.net`).includes(sender);

    // Rileva comando (inizia con prefisso del bot)
    const prefixes = [global.prefix || '.', '/', '!', '#'];
    const isCommand = prefixes.some(p => m.text?.startsWith(p));

    // Solo anti-spam comandi
    if (chat.antispamcomandi && !isOwner && isCommand) {
        if (!userCommandSpamCounters.has(m.chat)) {
            userCommandSpamCounters.set(m.chat, new Map());
        }
        const chatCounters = userCommandSpamCounters.get(m.chat);
        let userCounter = chatCounters.get(sender) || { count: 0, timer: null };

        userCounter.count++;
        if (userCounter.timer) clearTimeout(userCounter.timer);

        if (userCounter.count > LIMITS.COMMAND) {
            if (isBotAdmin) {
                await punishUser(m, sender, conn, 'comando');
            }
            chatCounters.delete(sender);
            return false;
        }

        userCounter.timer = setTimeout(() => {
            chatCounters.delete(sender);
            if (chatCounters.size === 0) {
                userCommandSpamCounters.delete(m.chat);
            }
        }, LIMITS.RESET_TIMEOUT);

        chatCounters.set(sender, userCounter);
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

async function punishUser(m, sender, conn, type) {
    try {
        // 1. Rimuovi l'utente
        await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');

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