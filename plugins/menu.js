module.exports = {
    commands: ['menu', 'help'],
    execute: async (sock, msg, context) => {
        const { from, CONFIG } = context;

        // Dynamic speed and memory tracking
        const startTime = Date.now();
        const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const totalMemory = 256; 
        const ramPercentage = Math.min(100, Math.round((usedMemory / totalMemory) * 100));
        const progressBarLength = 10;
        const filledLength = Math.round((ramPercentage / 100) * progressBarLength);
        const emptyLength = progressBarLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        const speed = ((Date.now() - startTime) / 1000).toFixed(4);

        let menuText = `✨ ┌ ◊ *ᴊᴏꜱʜᴜᴀ ʟᴜᴄɪꜰᴇʀ* ◊\n` +
                       `✨ │ *OWNER* : Joshua\n` +
                       `✨ │ *PREFIX* : [ ${CONFIG.PREFIX} ]\n` +
                       `✨ │ *HOST* : Panel\n` +
                       `✨ │ *MODE* : ${CONFIG.PRIVATE_MODE ? 'Private' : 'Public'}\n` +
                       `✨ │ *SPEED* : ${speed} ms\n` +
                       `✨ │ *RAM* : [${progressBar}] ${ramPercentage}%\n` +
                       `✨ └\n\n` +
                       `┌──◊ 🧠 *ABYSS & DEMONIC ARTS* ◊\n` +
                       `│ ➣ \`.lucifer [text]\` — Converse with the supreme ruler\n` +
                       `│ ➣ \`.demonarts\` — View forbidden arts\n` +
                       `│ ➣ \`.summon\` — View current weapons of the abyss\n` +
                       `│ ➣ \`.curse\` — Draw a legendary tool of torture\n` +
                       `│ ➣ \`.abyssexpansion\` — Nullify boundaries\n` +
                       `│ ➣ \`.bounty @user\` — Price on target's head\n` +
                       `│ ➣ \`.soulhijack @user\` — Infiltrate target's system\n` +
                       `│ ➣ \`.condemn @user\` — Unleash top-tier damnation\n` +
                       `│ ➣ \`.afk [reason]\` — Go Away From Keyboard\n` +
                       `│ ➣ \`.quote\` — Get an ancient cold quote\n` +
                       `└──◊\n\n` +
                       `┌──◊ 🎵 *UTILITY & SYSTEM* ◊\n` +
                       `│ ➣ \`.ping\`\n` +
                       `│ ➣ \`.uptime\`\n` +
                       `│ ➣ \`.repo\`\n` +
                       `│ ➣ \`.owner\` (Sends Owner Contact)\n` +
                       `│ ➣ \`.play [song name]\`\n` +
                       `│ ➣ \`.tts [text]\`\n` +
                       `│ ➣ \`.getpfp @user\`\n` +
                       `│ ➣ \`.getgpp\`\n` +
                       `│ ➣ \`.url\` (Reply image to upload as link)\n` +
                       `│ ➣ \`.s\` / \`.stickerms\` (Reply image to make sticker)\n` +
                       `└──◊\n\n` +
                       `┌──◊ 🛡️ *GROUP CONTROLS (Admin Only)* ◊\n` +
                       `│ ➣ \`.groupinfo\`\n` +
                       `│ ➣ \`.kick @user\`\n` +
                       `│ ➣ \`.promote @user\`\n` +
                       `│ ➣ \`.demote @user\`\n` +
                       `│ ➣ \`.tagall <msg>\`\n` +
                       `│ ➣ \`.hidetag <msg>\`\n` +
                       `│ ➣ \`.listadmins\`\n` +
                       `│ ➣ \`.kill @user\` (Banish/Kick)\n` +
                       `│ ➣ \`.togcstatus [desc]\`\n` +
                       `│ ➣ \`.group [open/close]\`\n` +
                       `└──◊\n\n` +
                       `┌──◊ ⚙️ *CONFIG (Owner Only)* ◊\n` +
                       `│ ➣ \`.setprefix [symbol]\`\n` +
                       `│ ➣ \`.mute @user\` | \`.unmute @user\`\n` +
                       `│ ➣ \`.sudo @user\` | \`.unsudo @user\`\n` +
                       `│ ➣ \`.setowner @user\`\n` +
                       `│ ➣ \`.setstickercmd [cmd]\`\n` +
                       `│ ➣ \`.runtime\`\n` +
                       `│ ➣ \`.botstatus\`\n` +
                       `│ ➣ \`.update\`\n` +
                       `└──◊`;
        
        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
    }
};
