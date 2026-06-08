module.exports = {
    commands: ['menu', 'help', 'gamemenu', 'adminmenu', 'allmenu'],
    execute: async (sock, msg, context) => {
        const { from, CONFIG, command } = context;

        // Real-time speed and memory tracker
        const startTime = Date.now();
        const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const totalMemory = 256; 
        const ramPercentage = Math.min(100, Math.round((usedMemory / totalMemory) * 100));
        const progressBarLength = 10;
        const filledLength = Math.round((ramPercentage / 100) * progressBarLength);
        const emptyLength = progressBarLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        const speed = ((Date.now() - startTime) / 1000).toFixed(4);

        const menuHeader = `✨ ┌ ◊ *ᴊᴏꜱʜᴜᴀ ʟᴜᴄɪꜰᴇʀ* ◊\n` +
                           `✨ │ *OWNER* : Joshua\n` +
                           `✨ │ *PREFIX* : [ ${CONFIG.PREFIX} ]\n` +
                           `✨ │ *HOST* : Panel\n` +
                           `✨ │ *MODE* : ${CONFIG.PRIVATE_MODE ? 'Private' : 'Public'}\n` +
                           `✨ │ *SPEED* : ${speed} ms\n` +
                           `✨ │ *RAM* : [${progressBar}] ${ramPercentage}%\n` +
                           `✨ └\n\n`;

        const aiMenu = `┌──◊ 🧠 *AI & CHATBOT* ◊\n` +
                       `│ ➣ \`.lucifer [text]\` — Converse with the supreme ruler\n` +
                       `│ ➣ \`.gojo [text]\` — Converse with the strongest sorcerer\n` +
                       `│ ➣ \`.ask [text]\` — Query the ancient Oracle\n` +
                       `│ ➣ \`.bard [text]\` — Query Bard's knowledge archive\n` +
                       `│ ➣ \`.gen [prompt]\` — Forge images using Prodia AI\n` +
                       `│ ➣ \`.chatbot [on/off]\` — Toggle auto-responder in DMs [1]\n` +
                       `└──◊`;

        const downloadMenu = `┌──◊ 📥 *DOWNLOAD MENU* ◊\n` +
                             `│ ➣ \`.song [name]\` — Retrieve MP3 audio files\n` +
                             `│ ➣ \`.video [name]\` — Retrieve MP4 video files\n` +
                             `│ ➣ \`.tiktok [url]\` — Extract watermark-free TikTok videos\n` +
                             `│ ➣ \`.facebook [url]\` — Extract Facebook SD/HD videos\n` +
                             `│ ➣ \`.tts [text]\` — Hear me speak your basic words\n` +
                             `└──◊`;

        const funMenu = `┌──◊ 🎲 *ABYSS GAMES & FUN* ◊\n` +
                        `│ ➣ \`.tictactoe [room]\` — Play a tactical match against a mortal\n` +
                        `│ ➣ \`.ship\` — Randomly pair two group members' fates\n` +
                        `│ ➣ \`.wasted @user\` — Apply the seal of death overlay\n` +
                        `│ ➣ \`.character @user\` — Run a detailed trait analysis\n` +
                        `│ ➣ \`.trivia\` — Test your trivial human knowledge\n` +
                        `│ ➣ \`.truth\` / \`.dare\` — Subject yourself to fate\n` +
                        `│ ➣ \`.bounty @user\` — Place a price on a soul\n` +
                        `│ ➣ \`.soulhijack @user\` — Infiltrate a user's system\n` +
                        `│ ➣ \`.condemn @user\` — Unleash high-tier damnation\n` +
                        `│ ➣ \`.curse\` — Draw a torture tool from Tartarus\n` +
                        `│ ➣ \`.summon\` — View your active weapons stash\n` +
                        `│ ➣ \`.abyssexpansion\` — Nullify local spatial boundaries\n` +
                        `│ ➣ \`.quote\` — Get an ancient, cold quote\n` +
                        `└──◊`;

        const groupMenu = `┌──◊ 🛡️ *GROUP CONTROLS* ◊\n` +
                          `│ ➣ \`.groupinfo\` — Inspect group's internal metrics\n` +
                          `│ ➣ \`.kick @user\` — Banish a pest from the group\n` +
                          `│ ➣ \`.promote @user\` — Elevate a thrall to Admin\n` +
                          `│ ➣ \`.demote @user\` — Strip an Admin of their power\n` +
                          `│ ➣ \`.tagall <msg>\` — Tag all members visibly\n` +
                          `│ ➣ \`.hidetag <msg>\` — Tag all members silently\n` +
                          `│ ➣ \`.listadmins\` — View active group admins\n` +
                          `│ ➣ \`.group [open/close]\` — Toggle group conversation gates\n` +
                          `│ ➣ \`.togcstatus [desc]\` — Shift group description\n` +
                          `│ ➣ \`.welcome <on/off/set>\` — Configure welcome metrics\n` +
                          `│ ➣ \`.antilink <on/off>\` — Configure link purification\n` +
                          `│ ➣ \`.antistatus <on/off>\` — Block status mention tags\n` +
                          `│ ➣ \`.warn @user\` — Issue an administrative warning\n` +
                          `│ ➣ \`.checkwarns @user\` — Check user's warning status\n` +
                          `│ ➣ \`.resetwarns @user\` — Clear user's warning metrics\n` +
                          `└──◊`;

        const ownerMenu = `┌──◊ ⚙️ *OWNER SETTINGS (Owner Only)* ◊\n` +
                          `│ ➣ \`.mode [private/public/dm]\` — Toggle bot dimensions\n` +
                          `│ ➣ \`.addsudo @user\` — Elevate a thrall to Sudo list\n` +
                          `│ ➣ \`.setstickercmd [cmd]\` — Bind command to a sticker\n` +
                          `│ ➣ \`.mute @user\` — Silently block a user from commands\n` +
                          `│ ➣ \`.unmute @user\` — Unbind a user's vocal chords\n` +
                          `│ ➣ \`.ban @user\` — Permanently ban a user from bot commands\n` +
                          `│ ➣ \`.unban @user\` — Lift banishment from a user\n` +
                          `│ ➣ \`.setreportgroup\` — Set official report arena\n` +
                          `│ ➣ \`.join [link]\` — Join a group via invitation link\n` +
                          `│ ➣ \`.leave\` — Leave the current group\n` +
                          `│ ➣ \`.restart\` — Reboot core physical systems\n` +
                          `│ ➣ \`.update\` — Synchronize with GitHub repository\n` +
                          `└──◊`;

        const toolsMenu = `┌──◊ 🔧 *TOOLS & UTILITIES* ◊\n` +
                          `│ ➣ \`.url\` — Reply image to upload as direct link [1, 2.1.2]\n` +
                          `│ ➣ \`.s\` / \`.sticker\` — Convert media to WhatsApp sticker\n` +
                          `│ ➣ \`.crop\` — Convert replied media to cropped sticker\n` +
                          `│ ➣ \`.take [pack|author]\` — Rename sticker ownership\n` +
                          `│ ➣ \`.tomp3\` — Convert replied video to MP3 audio\n` +
                          `│ ➣ \`.remini\` — Upscale image using AI\n` +
                          `│ ➣ \`.getpp @user\` — Extract profile photo\n` +
                          `│ ➣ \`.getgpp\` — Extract group profile photo\n` +
                          `│ ➣ \`.weather [city]\` — Current weather conditions\n` +
                          `│ ➣ \`.weather2 [city]\` — 5-day weather forecast\n` +
                          `│ ➣ \`.lyrics [song]\` — Extract lyrics from the web\n` +
                          `│ ➣ \`.translate [lang] [text]\` — Dual-fallback translator\n` +
                          `└──◊`;

        if (command === 'menu' || command === 'help') {
            const body = `${aiMenu}\n\n${downloadMenu}\n\n*Type \`.gamemenu\`, \`.adminmenu\`, or \`.allmenu\` to view other custom lists.*`;
            await sock.sendMessage(from, { image: { url: 'https://files.catbox.moe/yd6k76.png' }, caption: menuHeader + body }, { quoted: msg });
        } else if (command === 'gamemenu') {
            await sock.sendMessage(from, { image: { url: 'https://files.catbox.moe/915crn.jpeg' }, caption: menuHeader + funMenu }, { quoted: msg });
        } else if (command === 'adminmenu') {
            await sock.sendMessage(from, { image: { url: 'https://files.catbox.moe/13ys3f.jpeg' }, caption: menuHeader + groupMenu }, { quoted: msg });
        } else if (command === 'allmenu') {
            const allBody = `${aiMenu}\n\n${downloadMenu}\n\n${funMenu}\n\n${groupMenu}\n\n${toolsMenu}\n\n${ownerMenu}`;
            await sock.sendMessage(from, { image: { url: 'https://files.catbox.moe/34pqt2.jpeg' }, caption: menuHeader + allBody }, { quoted: msg });
        }
    }
};
