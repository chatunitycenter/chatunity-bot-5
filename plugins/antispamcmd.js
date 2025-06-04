let userSpamCounters = {};  // Start
const STICKER_LIMIT = 6;  // Start
const PHOTO_VIDEO_LIMIT = 3;  // Start
const RESET_TIMEOUT = 5000;  // Start

let userCommandSpamCounters = {};
const COMMAND_SPAM_LIMIT = 5; // Numero massimo di comandi consentiti in un breve periodo
const BAN_DURATION = 60 * 60 * 1000; // Durata del ban in millisecondi (1 ora)

export async function before(m, { isAdmin, isBotAdmin, conn }) {
    if (m.isBaileys && m.fromMe) return true;
    if (!m.isGroup) return false;

    let chat = global.db.data.chats[m.chat] || {};
    let bot = global.db.data.settings[this.user.jid] || {};
    let delet = m.key.participant;
    let bang = m.key.id;
    const sender = m.sender;  // Start
    const isOwner = global.owner.map(([number]) => number + '@s.whatsapp.net').includes(m.sender);

    // Controlla se la funzione antispam comandi è attiva
    if (chat.antispamcomandi && isOwner) {
        // Controlla se il messaggio è un comando
        const isCommand = m.text && m.text.startsWith('.');
        if (isCommand) {
            // Inizializza il contatore per l'utente
            if (!userCommandSpamCounters[m.chat]) {
                userCommandSpamCounters[m.chat] = {};
            }
            if (!userCommandSpamCounters[m.chat][sender]) {
                userCommandSpamCounters[m.chat][sender] = { count: 0, timer: null };
            }

            const counter = userCommandSpamCounters[m.chat][sender];
            counter.count++;

            // Controlla se l'utente ha superato il limite
            if (counter.count > COMMAND_SPAM_LIMIT) {
                if (isBotAdmin) {
                    try {
                        // Bannare l'utente
                        await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
                        await conn.sendMessage(m.chat, { text: `*SPAM COMANDI RILEVATO*\nL'utente @${sender.split('@')[0]} è stato bannato per 1 ora.`, mentions: [sender] });

                        // Imposta un timer per rimuovere il ban dopo 1 ora
                        setTimeout(async () => {
                            await conn.groupParticipantsUpdate(m.chat, [sender], 'add');
                            await conn.sendMessage(m.chat, { text: `*BAN TERMINATO*\nL'utente @${sender.split('@')[0]} è stato riammesso al gruppo.`, mentions: [sender] });
                        }, BAN_DURATION);
                    } catch (error) {
                        console.error('Errore durante il ban per spam comandi:', error);
                    }
                } else {
                    console.log('Il bot non è amministratore, impossibile bannare l\'utente.');
                }

                // Resetta il contatore
                delete userCommandSpamCounters[m.chat][sender];
            } else {
                // Resetta il contatore dopo il timeout
                if (counter.timer) clearTimeout(counter.timer);
                counter.timer = setTimeout(() => {
                    delete userCommandSpamCounters[m.chat][sender];
                }, RESET_TIMEOUT);
            }

            return true;
        }
    }

    // Start
    if (!userSpamCounters[m.chat]) {
        userSpamCounters[m.chat] = {};
    }
    if (!userSpamCounters[m.chat][sender]) {
        userSpamCounters[m.chat][sender] = { stickerCount: 0, photoVideoCount: 0, tagCount: 0, messageIds: [], lastMessageTime: 0, timer: null };
    }

    const counter = userSpamCounters[m.chat][sender];
    const currentTime = Date.now();

    // Start
    const isSticker = m.message?.stickerMessage;
    // DlStart
    const isPhoto = m.message?.imageMessage || m.message?.videoMessage;
    // Start
    const isTaggingAll = m.message?.extendedTextMessage?.text?.includes('@all') || m.message?.extendedTextMessage?.text?.includes('@everyone');

    if (isSticker || isPhoto || isTaggingAll) {
        if (isSticker) {
            counter.stickerCount++;
        } else if (isPhoto) {
            counter.photoVideoCount++;
        } else if (isTaggingAll) {
            counter.tagCount++;
        }

        counter.messageIds.push(m.key.id);
        counter.lastMessageTime = currentTime;

        // Start
        if (counter.timer) {
            clearTimeout(counter.timer);
        }

        // Start
        const isStickerSpam = counter.stickerCount >= STICKER_LIMIT;
        const isPhotoVideoSpam = counter.photoVideoCount >= PHOTO_VIDEO_LIMIT;
        const isTagSpam = counter.tagCount > 0;

        if (isStickerSpam || isPhotoVideoSpam || isTagSpam) {
            if (isBotAdmin && bot.restrict) {
                try {
                    console.log('Spam rilevato! Modificando le impostazioni del gruppo...');

                    // Start
                    await conn.groupSettingUpdate(m.chat, 'announcement');
                    console.log('Solo gli amministratori possono inviare messaggi.');

                    // Start
                    if (!isAdmin) {
                        let responseb = await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
                        console.log(`Participant removal response: ${JSON.stringify(responseb)}`);

                        if (responseb[0].status === "404") {
                            console.log('Utente non trovato o già rimosso.');
                        }
                    } else {
                        console.log('L\'utente è un amministratore e non verrà rimosso.');
                    }

                    // Start
                    for (const messageId of counter.messageIds) {
                        await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: messageId, participant: delet } });
                        console.log(`Messaggio con ID ${messageId} eliminato.`);
                    }
                    console.log('Tutti i messaggi di spam sono stati eliminati.');

                    // Start
                    await conn.groupSettingUpdate(m.chat, 'not_announcement');
                    console.log('Chat riattivata per tutti i membri.');

                    // Start
                    await conn.sendMessage(m.chat, { text: '*SPAM RILEVATO*' });
                    console.log('Messaggio di notifica antispam inviato.');

                    // Start
                    delete userSpamCounters[m.chat][sender];
                    console.log('Contatore di spam per l\'utente resettato.');

                } catch (error) {
                    console.error('Errore durante la gestione dello spam:', error);
                }
            } else {
                console.log('Bot non è amministratore o la restrizione è disattivata. Non posso eseguire l\'operazione.');
            }
        } else {
            // Start
            counter.timer = setTimeout(() => {
                delete userSpamCounters[m.chat][sender];
                console.log('Contatore di spam per l\'utente resettato dopo il timeout.');
            }, RESET_TIMEOUT);
        }
    } else {
        // Start
        if (currentTime - counter.lastMessageTime > RESET_TIMEOUT && (counter.stickerCount > 0 || counter.photoVideoCount > 0 || counter.tagCount > 0)) {
            console.log('Timeout scaduto. Reset del contatore di spam per l\'utente.');
            delete userSpamCounters[m.chat][sender];
        }
    }

    return true;
}