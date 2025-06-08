let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
let urlRegex = /(https?:\/\/[^\s]+)/g;

/* 
*  ANTI-LINK SYSTEM
*  Developed by Death
*  © 2024 - All rights reserved
*/

function extractTextAndUrlsFromMessage(message) {
    let extractedContent = {
        text: '',
        urls: []
    };

    if (!message) return extractedContent;

    function findContentInObject(obj) {
        if (typeof obj === 'string') {
            extractedContent.text += ' ' + obj;
            const foundUrls = obj.match(urlRegex);
            if (foundUrls) {
                extractedContent.urls.push(...foundUrls);
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    findContentInObject(obj[key]);
                }
            }
        }
    }
    findContentInObject(message);
    return {
        text: extractedContent.text.trim(),
        urls: [...new Set(extractedContent.urls)]
    };
}

export async function before(m, { isAdmin, isBotAdmin }) {
    if (m.isBaileys && m.fromMe) {
        return !0;
    }
    if (!m.isGroup) {
        return !1;
    }
    
    // System developed by Death
    let chat = global.db.data.chats[m.chat];
    let delet = m.key.participant;
    let bang = m.key.id;
    const user = `@${m.sender.split('@')[0]}`;
    const unv = {
        key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "Halo"
        },
        message: {
            contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Cellulare\nEND:VCARD`
            }
        },
        participant: "0@s.whatsapp.net"
    };
    let bot = global.db.data.settings[this.user.jid] || {};
    
    const { text: messageText, urls: extractedUrls } = extractTextAndUrlsFromMessage(m.message || {});

    const grupoPrefix = "https://chat.whatsapp.com";
    let containsGroupLink = false;
    if (linkRegex.exec(messageText)) {
        containsGroupLink = true;
    }
    if (!containsGroupLink) {
        for (const url of extractedUrls) {
            if (linkRegex.exec(url)) {
                containsGroupLink = true;
                break;
            }
        }
    }

    if (isAdmin && chat.antiLink && (messageText.includes(grupoPrefix) || containsGroupLink)) {
        return;
    }
    if (chat.antiLink && containsGroupLink && !isAdmin) {
        if (isBotAdmin) {
            const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`;
            if (messageText.includes(linkThisGroup) || extractedUrls.includes(linkThisGroup)) {
                return !0;
            }
        }
        if (!isBotAdmin) {
            return m.reply('𝐩𝐞𝐫 𝐪𝐮𝐞𝐬𝐭𝐚 𝐯𝐨𝐥𝐭𝐚 𝐭𝐢 𝐬𝐞𝐢 𝐬𝐚𝐥𝐯𝐚𝐭𝐨, 𝐧𝐨𝐧 𝐬𝐨𝐧𝐨 𝐚𝐝𝐦𝐢𝐧 𝐞 𝐧𝐨𝐧 𝐩𝐨𝐬𝐬𝐨 𝐟𝐚𝐫𝐞 𝐧𝐢𝐞𝐧𝐭𝐞\n\n⚡ Developed by Death');
        }
        
        await conn.sendMessage(m.chat, {
            text: `*「 𝐀𝐍𝐓𝐈-𝐋𝐈𝐍𝐊 𝐀𝐓𝐓𝐈𝐕𝐀𝐓𝐎 」*\n\n${user} 🤨 𝐇𝐚𝐢 𝐢𝐧𝐟𝐫𝐚𝐧𝐭𝐨 𝐋𝐞 𝐫𝐞𝐠𝐨𝐥𝐞 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.\n\n🔰 Powered by Death`, 
            mentions: [m.sender]
        }, {
            quoted: unv, 
            ephemeralExpiration: 24*60*100, 
            disappearingMessagesInChat: 24*60*100
        });

        if (isBotAdmin) {
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }});
            let responseb = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
            if (responseb[0].status === "404") {
                return;
            }
        } else if (!bot.restrict) {
            return m.reply('𝐂𝐎𝐍𝐓𝐀𝐓𝐓𝐀 𝐈𝐋 𝐏𝐑𝐎𝐏𝐑𝐈𝐄𝐓𝐀𝐑𝐈𝐎 𝐃𝐄𝐋 𝐁𝐎𝐓 𝐏𝐄𝐑 𝐀𝐓𝐓𝐈𝐕𝐀𝐑𝐄 𝐈𝐋 𝐑𝐄𝐒𝐓𝐑𝐈𝐂𝐓\n\n⚡ Developed by Death');
        }
    }
    return !0;
}

/*
*  Death System - Advanced Protection
*  github.com/death-developer
*  © 2024 Death Development
*/