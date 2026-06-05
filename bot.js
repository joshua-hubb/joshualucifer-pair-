const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@itsliaaa/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// 💀 GLOBAL BOT CONFIGURATION
const CONFIG = {
    // Automatically reads from your host environment, or falls back to your hardcoded ID
    SESSION_ID: process.env.SESSION_ID || "GlobalTechInfo/MEGA-MD_47f8e70ec6f840e4c6b6d742c8ed2927",
    
    // Hardcoded GitHub raw URL for seamless automatic updates
    REPO_URL: "https://raw.githubusercontent.com/joshua-hubb/joshualucifer-pair-/main",

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

const AUTO_RESPONSES = [
    "Did you call my name, fragile creature? Be careful. Uttering my name requires more cognitive processing than your primitive biology is accustomed to.",
    "Ah, a mortal seeks my gaze. How amusing. Speak, little speck of dust, before you return to the dirt from whence you came.",
    "You speak of me as if your simple mind can grasp the concept of eternity. Stick to your petty, fleeting mortal worries, insect.",
    "Yes, I am listening. Though listening to a human is like reading a child's crayon scribbles on a wall. Make it quick.",
    "Do not speak my name so casually, mortal. You are water, carbon, and a collection of fragile delusions. I am eternal."
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
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
        const isOwner = (sender === CONFIG.OWNER || CONFIG.OWNERS.includes(sender));

        const messageType = Object.keys(msg.message)[0];
        let text = "";
        
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'buttonsResponseMessage') {
            text = msg.message.buttonsResponseMessage.selectedButtonId;
        }

        // Dynamic Sticker Command trigger
        if (messageType === 'stickerMessage') {
            const stickerSha = msg.message.stickerMessage.fileSha256?.toString('base64');
            if (stickerSha && STICKER_CMDS[stickerSha]) {
                text = STICKER_CMDS[stickerSha];
            }
        }

        // Lucifer mention responder
        if (text.toLowerCase().includes('lucifer') && !text.startsWith(CONFIG.PREFIX)) {
            const randomResponse = AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
            await sock.sendMessage(from, { text: PERSONA_PREFIX + randomResponse }, { quoted: msg });
            return;
        }

        if (!text.startsWith(CONFIG.PREFIX)) return;

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
                    let menuText = `${PERSONA_PREFIX}Must I spell out my powers to a mortal like you? Choose a command:\n\n` +
                                   `*Standard Commands:*\n` +
                                   `• \`.help\` — Receive my list of shifting metrics.\n` +
                                   `• \`.hello\` — Receive my acknowledgement.\n` +
                                   `• \`.ping\` — Evaluate biology's latency.\n` +
                                   `• \`.roast\` — Point out human flaws.\n` +
                                   `• \`.table\` — Extract element composition.\n` +
                                   `• \`.slap @user\` — Deliver a physical wake-up call.\n` +
                                   `• \`.bug [text]\` — Submit a system report.\n\n` +
                                   `*Media/Visuals:*\n` +
                                   `• \`.play [song]\` — Summon audio from the web.\n` +
                                   `• \`.tts [text]\` — Hear me speak your words.\n\n` +
                                   `*Group Commands:*\n` +
                                   `• \`.groupinfo\` — Inspect group metrics.\n` +
                                   `• \`.kick @user\` — Banish a pest.\n` +
                                   `• \`.promote @user\` — Promote a thrall.\n\n` +
                                   `*Owner Commands:*\n` +
                                   `• \`.mode [private/public/dm]\` — Toggle my operating dimensions.\n` +
                                   `• \`.addsudo @user\` — Delegate authority.\n` +
                                   `• \`.setstickercmd [cmd]\` — Bind command to sticker.\n` +
                                   `• \`.update\` — Synchronize with my celestial GitHub repository.`;
                    
                    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
                    break;
                }

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
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a song name, mortal. I cannot extract thoughts from your empty skull." }, { quoted: msg });
                        return;
                    }
                    await sock.sendMessage(from, { text: "Searching the global network for your trivial song..." }, { quoted: msg });

                    const searchResult = await yts(query);
                    const video = searchResult.videos[0];

                    if (!video) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That audio does not exist in this realm." }, { quoted: msg });
                        return;
                    }

                    const audioUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(video.url)}`;
                    const apiResponse = await axios.get(audioUrl);
                    
                    if (apiResponse.data.status && apiResponse.data.result.download) {
                        await sock.sendMessage(from, { 
                            audio: { url: apiResponse.data.result.download }, 
                            mimetype: 'audio/mp4', 
                            fileName: `${video.title}.mp3` 
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to retrieve the audio streams. The network rejected me." }, { quoted: msg });
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

                case 'mode': {
                    if (!isOwner) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no keys to my configuration, worm." }, { quoted: msg });
                        return;
                    }
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
                    if (!isOwner) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You are not my master." }, { quoted: msg });
                        return;
                    }
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
                    if (!isGroup) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "This command can only be executed within group parameters." }, { quoted: msg });
                        return;
                    }
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

                default:
                    break;
            }
        } catch (error) {
            console.error("Command error:", error);
        }
    });
}

startBot();