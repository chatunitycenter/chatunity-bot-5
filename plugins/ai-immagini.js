import axios from "axios";
import fs from "fs";

const fluxHandler = async (m, { text, conn }) => {
    if (!text) return m.reply("Per favore dai un prompt per la creazione dell'immagine.");

    await m.reply("> CREAZIONE DELL'IMMAGINE...🔥");

    const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(text)}`;

    try {
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        if (!response || !response.data) {
            return m.reply("Error: The API did not return a valid image. Try again later.");
        }

        const imageBuffer = Buffer.from(response.data, "binary");

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `💸 *Immagine generata da Chatunity × Origin AI* 🚀\n✨ Prompt: *${text}*`
        });

    } catch (error) {
        console.error("FluxAI Error:", error);
        m.reply(`An error occurred: ${error.response?.data?.message || error.message || "Unknown error"}`);
    }
};

fluxHandler.command = ["fluxai", "flux", "imagine", "immagine", "img"];
fluxHandler.desc = "Generate an image using AI.";
fluxHandler.category = "main";
fluxHandler.react = "🚀";
fluxHandler.help = ["fluxai"];
fluxHandler.tags = ["ai"];

export default fluxHandler;