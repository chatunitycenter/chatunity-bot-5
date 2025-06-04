import { performance } from 'perf_hooks';
import fetch from 'node-fetch'; 
import path from 'path';
import { fileURLToPath } from 'url';

const handler = async (message, { conn, usedPrefix }) => {
    const userCount = Object.keys(global.db.data.users).length;
    const botName = global.db.data.nomedelbot || 'ChatUnity';

    const menuText = generateMenuText(usedPrefix, botName, userCount);

    const messageOptions = {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363259442839354@newsletter',
                serverMessageId: '',
                newsletterName: `${botName}`
            },
        }
    };

    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const videoPath = path.join(__dirname, '../menu/chatunity-bot.gif'); 

    
    await conn.sendMessage(message.chat, {
        video: { url: videoPath },
        mimetype: 'video/mp4',
        caption: menuText,
        buttons: [
            { buttonId: `${usedPrefix}menuadmin`, buttonText: { displayText: "🛡️ Menu Admin" }, type: 1 },
            { buttonId: `${usedPrefix}menuowner`, buttonText: { displayText: "👑 Menu Owner" }, type: 1 },
            { buttonId: `${usedPrefix}menugruppo`, buttonText: { displayText: "👥 Menu Gruppo" }, type: 1 },
            { buttonId: `${usedPrefix}menusicurezza`, buttonText: { displayText: "🚨 Menu Sicurezza" }, type: 1 },
            { buttonId: `${usedPrefix}menuia`, buttonText: { displayText: "🤖 Menu IA" }, type: 1 }
        ],
        ...messageOptions
    }, { quoted: message });
};

async function fetchThumbnail(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error('Errore durante il fetch della thumbnail:', error);
        return 'default-thumbnail'; 
    }
}

handler.help = ['menu'];
handler.tags = ['menu'];
handler.command = /^(menu|comandi)$/i;

export default handler;

function generateMenuText(prefix, botName, userCount) {
    return `

╭〔 *💬 𝑴𝑬𝑵𝑼 𝑫𝑬𝑳 𝑩𝑶𝑻 💬* 〕┈⊷
┃◈╭───────────·๏
┃◈┃• 👑 *${prefix}staff*
┃◈┃• 📜 *${prefix}candidati*
┃◈┃• 📥 *${prefix}installa*
┃◈┃• 📖 *${prefix}guida*
┃◈┃• ⚙ *${prefix}sistema*
┃◈┃• ❓ *${prefix}FAQ*
┃◈┃• 🚀 *${prefix}ping*
┃◈┃• 📝 *${prefix}segnala* (comando)
┃◈┃• 💡 *${prefix}consiglia* (comando)
┃◈┃
┃◈└───────────┈⊷
┃◈┃• *𝑽𝑬𝑹𝑺𝑰𝑶𝑵𝑬:* ${vs}
┃◈┃•  𝐂𝐎𝐋𝐋𝐀𝐁: 𝐉𝐉𝐊
┃◈┃• *𝐒𝐔𝐏𝐏𝐎𝐑𝐓𝐎:* (.supporto)
╰━━━━━━━━━━━━━┈·๏
`.trim();
}
