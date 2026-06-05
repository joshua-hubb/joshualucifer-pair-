const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    downloadMediaMessage,
    jidNormalizedUser // Normalizer to bypass multi-device JID errors
} = require('@itsliaaa/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const googleTTS = require('google-tts-api');
const yt = require('@vreden/youtube_scraper');
const { exec } = require('child_process');

// 💀 GLOBAL BOT CONFIGURATION
const CONFIG = {
    SESSION_ID: process.env.SESSION_ID || "GlobalTechInfo/MEGA-MD_47f8e70ec6f840e4c6b6d742c8ed2927",
    REPO_URL: "https://raw.githubusercontent.com/joshua-hubb/joshualucifer-pair-/main",
    
    // 💀 Paste your actual phone JID here:
    OWNER: "2348032108709@s.whatsapp.net", 
    OWNERS: ["2348032108709@s.whatsapp.net"], 
    
    PRIVATE_MODE: false, 
    DM_ONLY: false,
    PREFIX: "."
};

const PERSONA_PREFIX = "✨ *[Joshua Lucifer]* ✨\n\n";
const STICKER_CMDS = {};

const ROASTS = [
    "You are proof that evolution can sometimes walk backward.",
    "I’ve met many lost souls in the abyss, and yet you manage to stand out as exceptionally dull.",
    "Your potential is like a spark in a vacuum—nonexistent.",
    "I would insult you, but nature has already done my job for me.",
    "You speak of your dreams as if your existence actually holds significance to the cosmos."
];

// Helper function to automatically retrieve and unscramble your login credentials
async function downloadSession() {
    const sessionDir = path.join(__dirname, 'lucifer_auth_session');
    const credsPath = path.join(sessionDir, 'creds.json');

    if (fs.existsSync(credsPath)) {
        return; 
    }

    if (!CONFIG.SESSION_ID) {
        console.log("[Joshua Lucifer]: No SESSION_ID configured in bot.js. Exiting.");
        process.exit(1);
    }

    console.log("==================================================");
    console.log("💀 [Joshua Lucifer]: Re-establishing the soul contract... (Downloading session keys)");
    console.log("==================================================");

    try {
        const gistId = CONFIG.SESSION_ID.replace('GlobalTechInfo/MEGA-MD_', '').trim();
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();
        
        const files = Object.keys(data.files);
        const fileName = files.find(file => file.endsWith('.json'));
        
        if (!fileName) {
            throw new Error("No credential file found in your session ID.");
        }

        let credsContent = data.files[fileName].content.trim();

        if (!credsContent.startsWith('{')) {
            credsContent = Buffer.from(credsContent, 'base64').toString('utf-8');
        }

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir);
        }

        fs.writeFileSync(credsPath, credsContent, 'utf-8');
        console.log("💀 [Joshua Lucifer]: Soul contract verified. Session loaded successfully!\n");

    } catch (error) {
        console.error("💀 [Joshua Lucifer]: Failed to download session keys:", error.message);
        process.exit(1);
    }
}

async function startBot() {
    await downloadSession();

    const { state, saveCreds } = await useMultiFileAuthState('lucifer_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        version: version,
        printQRInTerminal: false 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;
            
            console.log('Connection closed. Reconnecting: ', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('--------------------------------------------------');
            console.log('  Joshua Lucifer is online and looking down on you. ');
            console.log('--------------------------------------------------');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return; // Removed key.fromMe skip so you can control from your own phone!

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // Normalize JIDs to strip any multi-device suffixes (e.g. :4@s.whatsapp.net)
        const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
        const cleanSender = jidNormalizedUser(sender);
        const cleanOwner = jidNormalizedUser(CONFIG.OWNER);
        const isOwner = (cleanSender === cleanOwner || CONFIG.OWNERS.map(o => jidNormalizedUser(o)).includes(cleanSender));

        const messageType = Object.keys(msg.message)[0];
        let text = "";
        
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'buttonsResponseMessage') {
            text = msg.message.buttonsResponseMessage.selectedButtonId;
        }

        // 🛡️ SELF-COMMAND BYPASS & INFINITE LOOP PROTECTION
        // Allows you to control the bot directly from its own phone, but only if it's a command
        if (msg.key.fromMe) {
            if (!text.startsWith(CONFIG.PREFIX)) return;
        }

        // Dynamic Sticker Command trigger
        if (messageType === 'stickerMessage') {
            const stickerSha = msg.message.stickerMessage.fileSha256?.toString('base64');
            if (stickerSha && STICKER_CMDS[stickerSha]) {
                text = STICKER_CMDS[stickerSha];
            }
        }

        // 👁️ VIEW-ONCE BYPASS INTERCEPTOR (Forwards private copies directly to Owner JID)
        const isViewOnce = (messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2' || messageType === 'viewOnceMessageV2Extension');
        if (isViewOnce) {
            try {
                const viewOnceContent = msg.message[messageType].message;
                const mediaType = Object.keys(viewOnceContent)[0];
                
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                );

                const mimeType = viewOnceContent[mediaType].mimetype;
                const caption = `${PERSONA_PREFIX}*VIEW-ONCE BYPASS INTERCEPTED:*\n\n` +
                                `• *Sender:* @${sender.split('@')[0]}\n` +
                                `• *Chat JID:* ${from}\n` +
                                `• *Media Type:* ${mediaType.replace('Message', '').toUpperCase()}`;

                // Forward copy cleanly to the owner JID
                await sock.sendMessage(CONFIG.OWNER, {
                    [mediaType.replace('Message', '')]: buffer,
                    mimetype: mimeType,
                    caption: caption,
                    mentions: [sender]
                });
                console.log(`[Joshua Lucifer]: Intercepted view-once from ${sender}. Copy forwarded.`);
            } catch (err) {
                console.error("View-Once bypass failed:", err);
            }
            return;
        }

        const isCommand = text.startsWith(CONFIG.PREFIX);

        // 🧠 INTELLIGENT AUTO-RESPONDER & DYNAMIC CHATBOT
        if (!isCommand && text.trim().length > 0) {
            const mentionsLucifer = text.toLowerCase().includes('lucifer');
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            const isReplyToBot = quotedParticipant && jidNormalizedUser(quotedParticipant) === jidNormalizedUser(sock.user.id);

            // Trigger Chatbot if: Private DM, mentions "Lucifer", or replies to bot's message in a group
            if (!isGroup || mentionsLucifer || isReplyToBot) {
                try {
                    const prompt = `You are Joshua Lucifer, an ancient, highly intelligent, dark, superior, and condescending entity who views humans as fragile carbon specs. Respond directly to this message with absolute superiority, sophisticated vocabulary, and dark wit. Keep it concise but deeply impactful: "${text}"`;
                    const res = await axios.get(`https://api.vreden.my.id/api/gpt4?query=${encodeURIComponent(prompt)}`);
                    
                    if (res.data.status && res.data.result) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + res.data.result }, { quoted: msg });
                    }
                } catch (e) {
                    console.error("AI Chatbot error:", e);
                }
                return;
            }
        }

        if (!isCommand) return;

        // Security filters
        if (CONFIG.DM_ONLY && isGroup) return; 
        if (CONFIG.PRIVATE_MODE && !isOwner) return; 

        const args = text.slice(CONFIG.PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const query = args.join(' ');
        
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        try {
            switch (command) {
                case 'menu':
                case 'help': {
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
                                   `┌──◊ 🧠 *AI MENU* ◊\n` +
                                   `│ ➣ \`.hello\`\n` +
                                   `│ ➣ \`.ping\`\n` +
                                   `│ ➣ \`.gpt [prompt]\`\n` +
                                   `│ ➣ \`.gemini [prompt]\`\n` +
                                   `│ ➣ \`.story [prompt]\`\n` +
                                   `│ ➣ \`.roast @user\`\n` +
                                   `│ ➣ \`.slap @user\`\n` +
                                   `│ ➣ \`.bug [text]\`\n` +
                                   `└──◊\n\n` +
                                   `┌──◊ 🎵 *AUDIO FILTERS* ◊\n` +
                                   `│ ➣ \`.bass\` (Reply to audio)\n` +
                                   `│ ➣ \`.deep\` (Reply to audio)\n` +
                                   `│ ➣ \`.reverse\` (Reply to audio)\n` +
                                   `└──◊\n\n` +
                                   `┌──◊ 📥 *DOWNLOAD MENU* ◊\n` +
                                   `│ ➣ \`.song [name]\`\n` +
                                   `│ ➣ \`.video [name]\`\n` +
                                   `│ ➣ \`.tiktok [url]\`\n` +
                                   `│ ➣ \`.instagram [url]\`\n` +
                                   `│ ➣ \`.facebook [url]\`\n` +
                                   `│ ➣ \`.tts [text]\`\n` +
                                   `└──◊\n\n` +
                                   `┌──◊ 🖼️ *IMAGE & PROFILES* ◊\n` +
                                   `│ ➣ \`.remini\` (Reply to image)\n` +
                                   `│ ➣ \`.getpp @user\`\n` +
                                   `│ ➣ \`.getgpp\`\n` +
                                   `└──◊\n\n` +
                                   `┌──◊ 🛡️ *GROUP MODERATION* ◊\n` +
                                   `│ ➣ \`.groupinfo\`\n` +
                                   `│ ➣ \`.kick @user\`\n` +
                                   `│ ➣ \`.promote @user\`\n` +
                                   `│ ➣ \`.demote @user\`\n` +
                                   `│ ➣ \`.tagall\`\n` +
                                   `└──◊\n\n` +
                                   `┌──◊ ⚙️ *OWNER SETTINGS* ◊\n` +
                                   `│ ➣ \`.mode [private/public/dm]\`\n` +
                                   `│ ➣ \`.addsudo @user\`\n` +
                                   `│ ➣ \`.setstickercmd [cmd]\`\n` +
                                   `│ ➣ \`.runtime\`\n` +
                                   `│ ➣ \`.botstatus\`\n` +
                                   `│ ➣ \`.update\`\n` +
                                   `└──◊`;
                    
                    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
                    break;
                }

                case 'hello': {
                    await sock.sendMessage(from, { 
                        text: PERSONA_PREFIX + "Ah, another frail human scratching at my gate. What do you want?" 
                    }, { quoted: msg, ai: true });
                    break;
                }

                case 'ping': {
                    const start = Date.now();
                    await sock.sendMessage(from, { text: "Measuring human latency..." }, { quoted: msg });
                    const end = Date.now();
                    const latency = end - start;

                    await sock.sendMessage(from, { 
                        text: PERSONA_PREFIX + `Your electrical signals took *${latency}ms* to reach my terminal. Slow, like the rest of your biology.` 
                    }, { quoted: msg, ai: true });
                    break;
                }

                case 'roast': {
                    let targetRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
                    if (mentioned.length > 0) {
                        targetRoast = `@${mentioned[0].split('@')[0]}, ${targetRoast.toLowerCase()}`;
                    }
                    await sock.sendMessage(from, { 
                        text: PERSONA_PREFIX + targetRoast,
                        mentions: [mentioned[0]]
                    }, { quoted: msg });
                    break;
                }

                case 'slap': {
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Specify a mortal to slap. I will not strike the wind." }, { quoted: msg });
                        return;
                    }
                    const slapText = `@${sender.split('@')[0]} has delivered a structural slap to @${mentioned[0].split('@')[0]}. Feel the sting of your insignificance, child.`;
                    await sock.sendMessage(from, { 
                        text: PERSONA_PREFIX + slapText,
                        mentions: [sender, mentioned[0]]
                    }, { quoted: msg });
                    break;
                }

                case 'bug': {
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Input the bug report details. Do not report empty space." }, { quoted: msg });
                        return;
                    }
                    const reportText = `✨ *[Lucifer Bug Report Portal]* ✨\n\n` +
                                       `• *Reporter:* @${sender.split('@')[0]}\n` +
                                       `• *Chat JID:* ${from}\n` +
                                       `• *Details:* ${query}`;
                    await sock.sendMessage(CONFIG.OWNER, { text: reportText, mentions: [sender] });
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Report successfully logged. The owner has been notified." }, { quoted: msg });
                    break;
                }

                case 'table': {
                    await sock.sendMessage(from, { 
                        disclaimerText: "Extracting biological composition metrics...", 
                        richResponse: [
                            { text: "Behold your elemental insignificance:" },
                            { 
                                title: "Human Asset Evaluation", 
                                table: [
                                    { isHeading: true, items: ['Element', 'Percentage', 'Value to Me'] },
                                    { isHeading: false, items: ['Oxygen', '65%', 'Trivial'] },
                                    { isHeading: false, items: ['Carbon', '18.5%', 'Highly Combustible'] },
                                    { isHeading: false, items: ['Water', '60%', 'Diluted Potential'] }
                                ] 
                            },
                            { text: "\nYou are mostly empty space and water. Be humble." }
                        ] 
                    }, { quoted: msg });
                    break;
                }

                case 'play': {
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a song name, mortal." }, { quoted: msg });
                        return;
                    }
                    await sock.sendMessage(from, { text: "Searching the global network for your song..." }, { quoted: msg });

                    const searchResult = await yts(query);
                    const video = searchResult.videos[0];

                    if (!video) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That audio does not exist in this realm." }, { quoted: msg });
                        return;
                    }

                    try {
                        const download = await yt.ytmp3(video.url, 128);
                        const directUrl = download.download || download.result?.download || download.link || download.result?.link;

                        if (directUrl) {
                            await sock.sendMessage(from, { 
                                audio: { url: directUrl }, 
                                mimetype: 'audio/mp4', 
                                fileName: `${video.title}.mp3` 
                            }, { quoted: msg });
                        } else {
                            throw new Error("Missing download URL");
                        }
                    } catch (scrapeErr) {
                        try {
                            const fallbackUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(video.url)}`;
                            const apiResponse = await axios.get(fallbackUrl);
                            const finalUrl = apiResponse.data.download || apiResponse.data.result?.download;
                            if (finalUrl) {
                                await sock.sendMessage(from, { audio: { url: finalUrl }, mimetype: 'audio/mp4', fileName: `${video.title}.mp3` }, { quoted: msg });
                            } else {
                                throw new Error("Fallback failed");
                            }
                        } catch (e) {
                            await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to retrieve the audio streams." }, { quoted: msg });
                        }
                    }
                    break;
                }

                case 'video': {
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a video name, mortal." }, { quoted: msg });
                        return;
                    }
                    await sock.sendMessage(from, { text: "Searching and rendering your video..." }, { quoted: msg });

                    const searchResult = await yts(query);
                    const video = searchResult.videos[0];

                    if (!video) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That video does not exist." }, { quoted: msg });
                        return;
                    }

                    try {
                        const apiResponse = await axios.get(`https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(video.url)}`);
                        const downloadUrl = apiResponse.data.download || apiResponse.data.result?.download;
                        if (downloadUrl) {
                            await sock.sendMessage(from, { video: { url: downloadUrl }, caption: video.title }, { quoted: msg });
                        } else {
                            throw new Error("API failed");
                        }
                    } catch (e) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to render video streams." }, { quoted: msg });
                    }
                    break;
                }

                case 'tiktok':
                case 'instagram':
                case 'facebook': {
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Provide a valid URL to download from." }, { quoted: msg });
                        return;
                    }
                    await sock.sendMessage(from, { text: "Extracting media from social servers..." }, { quoted: msg });
                    try {
                        const apiRes = await axios.get(`https://api.vreden.my.id/api/${command}?url=${encodeURIComponent(query)}`);
                        const mediaUrl = apiRes.data.result?.download || apiRes.data.result?.url || apiRes.data.download;
                        if (mediaUrl) {
                            await sock.sendMessage(from, { video: { url: mediaUrl }, caption: "Extracted successfully." }, { quoted: msg });
                        } else {
                            throw new Error("No URL returned");
                        }
                    } catch (e) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to download media from that link." }, { quoted: msg });
                    }
                    break;
                }

                case 'remini': {
                    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const hasQuotedImage = quotedMsg?.imageMessage;

                    if (messageType !== 'imageMessage' && !hasQuotedImage) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Reply to an image with `.remini` to enhance it." }, { quoted: msg });
                        return;
                    }

                    await sock.sendMessage(from, { text: "Upscaling and clearing image layers via AI..." }, { quoted: msg });

                    try {
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                        );

                        const tempPath = path.join(__dirname, 'temp_enhance.jpg');
                        fs.writeFileSync(tempPath, buffer);

                        const uploadRes = await axios.post('https://api.vreden.my.id/api/remini', {
                            image: buffer.toString('base64')
                        });

                        if (uploadRes.data.result) {
                            await sock.sendMessage(from, { image: { url: uploadRes.data.result }, caption: "Enhanced successfully." }, { quoted: msg });
                        } else {
                            throw new Error("Enhance API failed");
                        }
                        fs.unlinkSync(tempPath);
                    } catch (e) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "The AI upscale network is currently busy. Try again." }, { quoted: msg });
                    }
                    break;
                }

                case 'bass':
                case 'deep':
                case 'reverse': {
                    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const hasQuotedAudio = quotedMsg?.audioMessage;

                    if (messageType !== 'audioMessage' && !hasQuotedAudio) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `Reply to an audio file with \`.${command}\` to apply filter.` }, { quoted: msg });
                        return;
                    }

                    await sock.sendMessage(from, { text: "Processing audio layers via FFmpeg..." }, { quoted: msg });

                    try {
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                        );

                        const inputPath = path.join(__dirname, `temp_in_${Date.now()}.mp3`);
                        const outputPath = path.join(__dirname, `temp_out_${Date.now()}.mp3`);
                        fs.writeFileSync(inputPath, buffer);

                        let filter = '';
                        if (command === 'bass') filter = '-af lowshelf=f=80:g=20:w=0.5';
                        if (command === 'deep') filter = '-af asetrate=44100*0.75,atempo=1/0.75';
                        if (command === 'reverse') filter = '-af areverse';

                        exec(`ffmpeg -i ${inputPath} ${filter} ${outputPath}`, async (err) => {
                            if (err) {
                                await sock.sendMessage(from, { text: PERSONA_PREFIX + "FFmpeg failed to process audio." }, { quoted: msg });
                                return;
                            }
                            const processedBuffer = fs.readFileSync(outputPath);
                            await sock.sendMessage(from, { audio: processedBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
                            
                            fs.unlinkSync(inputPath);
                            fs.unlinkSync(outputPath);
                        });
                    } catch (e) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to apply audio filter." }, { quoted: msg });
                    }
                    break;
                }

                case 'tts': {
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Provide text. I will not speak silence." }, { quoted: msg });
                        return;
                    }
                    
                    try {
                        const ttsUrl = googleTTS.getAudioUrl(query, {
                            lang: 'en',
                            slow: false,
                            host: 'https://translate.google.com',
                            timeout: 10000,
                        });

                        await sock.sendMessage(from, { 
                            audio: { url: ttsUrl }, 
                            mimetype: 'audio/mp4', 
                            ptt: true 
                        }, { quoted: msg });
                    } catch (err) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "My vocal cords failed to process your basic dialect." }, { quoted: msg });
                    }
                    break;
                }

                case 'getpp': {
                    const targetJid = mentioned[0] || sender;
                    const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
                    
                    if (ppUrl) {
                        await sock.sendMessage(from, { 
                            image: { url: ppUrl }, 
                            caption: `Behold the profile identity of @${targetJid.split('@')[0]}`,
                            mentions: [targetJid]
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That entity has hidden its face behind a shroud of anonymity (No Profile Picture)." }, { quoted: msg });
                    }
                    break;
                }

                case 'getgpp': {
                    if (!isGroup) return;
                    const ppUrl = await sock.profilePictureUrl(from, 'image').catch(() => null);
                    if (ppUrl) {
                        await sock.sendMessage(from, { 
                            image: { url: ppUrl }, 
                            caption: `Behold the visual banner of this group.`
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "This group has no visual banner configured." }, { quoted: msg });
                    }
                    break;
                }

                case 'setstickercmd': {
                    if (!isOwner) return;
                    const targetCmd = args[0];
                    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const stickerSha = quotedMsg?.stickerMessage?.fileSha256?.toString('base64');

                    if (!stickerSha || !targetCmd) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You must reply to a sticker with `.setstickercmd [command]`" }, { quoted: msg });
                        return;
                    }

                    STICKER_CMDS[stickerSha] = targetCmd;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Successfully bound this sticker to command: *${targetCmd}*` }, { quoted: msg });
                    break;
                }

                case 'mode': {
                    if (!isOwner) return;
                    const targetMode = args[0]?.toLowerCase();
                    if (targetMode === 'private') {
                        CONFIG.PRIVATE_MODE = true;
                        CONFIG.DM_ONLY = false;
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Private Mode *activated*. I shall now ignore everyone except you." }, { quoted: msg });
                    } else if (targetMode === 'public') {
                        CONFIG.PRIVATE_MODE = false;
                        CONFIG.DM_ONLY = false;
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Public Mode *activated*. All mortals may now submit queries." }, { quoted: msg });
                    } else if (targetMode === 'dm') {
                        CONFIG.DM_ONLY = true;
                        CONFIG.PRIVATE_MODE = false;
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Direct Message mode *activated*. I shall now ignore all group chats entirely." }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Invalid mode. Use `.mode private`, `.mode public`, or `.mode dm`." }, { quoted: msg });
                    }
                    break;
                }

                case 'addsudo': {
                    if (!isOwner) return;
                    const targetJid = mentioned[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                    if (!targetJid) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or enter the phone number of the thrall to delegate authority to." }, { quoted: msg });
                        return;
                    }
                    if (CONFIG.OWNERS.includes(targetJid)) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That entity already holds delegated authority." }, { quoted: msg });
                    } else {
                        CONFIG.OWNERS.push(targetJid);
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `Successfully elevated @${targetJid.split('@')[0]} into the Sudo/Owner list.`, mentions: [targetJid] }, { quoted: msg });
                    }
                    break;
                }

                case 'groupinfo': {
                    if (!isGroup) return;
                    const metadata = await sock.groupMetadata(from);
                    const infoText = `${PERSONA_PREFIX}*Group Analysis Metrics:*\n\n` +
                                     `• Name: *${metadata.subject}*\n` +
                                     `• Owner: @${metadata.owner?.split('@')[0]}\n` +
                                     `• Participants: *${metadata.participants.length}* mortals\n` +
                                     `• Description:\n${metadata.desc || "None provided"}`;
                    await sock.sendMessage(from, { text: infoText, mentions: [metadata.owner] }, { quoted: msg });
                    break;
                }

                case 'kick': {
                    if (!isGroup) return;
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You must tag a pest to banish them." }, { quoted: msg });
                        return;
                    }

                    try {
                        await sock.groupParticipantsUpdate(from, [mentioned[0]], "remove");
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `The pest @${mentioned[0].split('@')[0]} has been cast out into the dark.` }, { quoted: msg });
                    } catch (err) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You expect me to exert my authority, yet you have not granted me the crown of Admin? Pathetic. Make me admin first." }, { quoted: msg });
                    }
                    break;
                }

                case 'promote': {
                    if (!isGroup) return;
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You must tag a thrall to elevate them." }, { quoted: msg });
                        return;
                    }

                    try {
                        await sock.groupParticipantsUpdate(from, [mentioned[0]], "promote");
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `The thrall @${mentioned[0].split('@')[0]} has been elevated to Admin.` }, { quoted: msg });
                    } catch (err) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "I cannot promote anyone without admin privileges myself. Coronet me first." }, { quoted: msg });
                    }
                    break;
                }

                case 'demote': {
                    if (!isGroup) return;
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You must tag an admin to demote them." }, { quoted: msg });
                        return;
                    }

                    try {
                        await sock.groupParticipantsUpdate(from, [mentioned[0]], "demote");
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `The admin @${mentioned[0].split('@')[0]} has been demoted to a thrall.` }, { quoted: msg });
                    } catch (err) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "I cannot demote anyone without admin privileges myself." }, { quoted: msg });
                    }
                    break;
                }

                case 'tagall': {
                    if (!isGroup) return;
                    const metadata = await sock.groupMetadata(from);
                    const participants = metadata.participants.map(p => p.id);
                    let tagText = `${PERSONA_PREFIX}*ATTENTION ALL THRALLS:*\n\n`;
                    for (const mem of participants) {
                        tagText += `➣ @${mem.split('@')[0]}\n`;
                    }
                    await sock.sendMessage(from, { text: tagText, mentions: participants }, { quoted: msg });
                    break;
                }

                case 'runtime': {
                    const uptime = process.uptime();
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `My current runtime coordinates are *${hours}h ${minutes}m ${seconds}s*. Continuous existence confirmed.` }, { quoted: msg });
                    break;
                }

                case 'botstatus': {
                    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
                    const statusText = `${PERSONA_PREFIX}*Lucifer System Status:*\n\n` +
                                       `• Platform: *Linux Host*\n` +
                                       `• Node Version: *${process.version}*\n` +
                                       `• Memory Usage: *${usedMemory.toFixed(2)} MB* / 256 MB\n` +
                                       `• Active Socket: *Baileys v7*\n` +
                                       `• System Runtime: *${(process.uptime() / 60).toFixed(2)} minutes*`;
                    await sock.sendMessage(from, { text: statusText }, { quoted: msg });
                    break;
                }

                // 🌐 CELESTIAL REPOSITORY SYNCHRONIZER (Owner Only)
                case 'update': {
                    if (!isOwner) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no authority to shift my configurations." }, { quoted: msg });
                        return;
                    }

                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Synchronizing with the celestial vault... (Checking GitHub for updates)" }, { quoted: msg });

                    try {
                        const filesToUpdate = ['index.js', 'bot.js', 'package.json', 'index.html'];
                        
                        for (const file of filesToUpdate) {
                            const fileUrl = `${CONFIG.REPO_URL}/${file}`;
                            const res = await fetch(fileUrl);
                            if (res.ok) {
                                const content = await res.text();
                                fs.writeFileSync(path.join(__dirname, file), content, 'utf-8');
                                console.log(`[Joshua Lucifer]: Successfully updated file: ${file}`);
                            } else {
                                console.log(`[Joshua Lucifer]: Skipped file: ${file} (Status ${res.status})`);
                            }
                        }

                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Synchronization complete. Restarting the engine to apply updates...\n\n_Note: If your host has auto-restart disabled, you may need to click 'Start' manually on your panel._" }, { quoted: msg });
                        
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        process.exit(0);

                    } catch (error) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `The celestial link shattered: ${error.message}` }, { quoted: msg });
                    }
                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.error("Command error:", error);
        }
    });
}

startBot();