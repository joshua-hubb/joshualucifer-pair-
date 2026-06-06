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
    
    // 💀 Dedicated Groq API Key
    GROQ_API_KEY: process.env.GROQ_API_KEY || "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",

    // 💀 Your exact phone JID is permanently pre-filled below:
    OWNER: "2348032108709@s.whatsapp.net", 
    OWNERS: ["2348032108709@s.whatsapp.net"], 
    
    PRIVATE_MODE: false, 
    DM_ONLY: false,
    PREFIX: "."
};

const PERSONA_PREFIX = "✨ *[Joshua Lucifer]* ✨\n\n";
const STICKER_CMDS = {};
const BOUNTIES = {};
const AFK_USERS = {};
const MUTED_USERS = [];

const CURSE_WEAPONS = [
    { name: "Scythe of the Underworld", desc: "Forged in the deepest fires of Tartarus, designed to harvest fragile mortal souls." },
    { name: "Trident of the Abyss", desc: "A three-pronged spear channeling the crushing pressure of the infinite oceans of the dark." },
    { name: "Spade of the Damned", desc: "Used to dig the shallow graves of those who dare challenge the supreme ruler." },
    { name: "Chains of Tartarus", desc: "Infinite glowing red chains that bind any entity's spiritual movement." }
];

const FORBIDDEN_ARTS = [
    { name: "Hellfire Condemnation", desc: "Summons black flames from the abyss that consume the target's cognitive capacity." },
    { name: "Shadow Manipulation", desc: "Converts the shadows of nearby mortals into active, binding physical restraints." },
    { name: "Soul Fracture", desc: "Bypasses the physical body to strike directly at the target's spiritual foundation." },
    { name: "Abyss Void", desc: "Shatters local space-time coordinates, leaving the target suspended in absolute silence." }
];

const ROASTS = [
    "You are proof that evolution can sometimes walk backward.",
    "I’ve met many lost souls in the abyss, and yet you manage to stand out as exceptionally dull.",
    "Your potential is like a spark in a vacuum—nonexistent.",
    "I would insult you, but nature has already done my job for me.",
    "You speak of your dreams as if your existence actually holds significance to the cosmos."
];

// Helper to sanitize WhatsApp JIDs across multi-device configurations
function cleanJid(jid) {
    if (!jid) return '';
    const cleanUser = jid.split(':')[0].split('@')[0].trim().toLowerCase();
    const domain = jid.split('@')[1] || 's.whatsapp.net';
    return `${cleanUser}@${domain}`;
}

// Helper to extract text from various WhatsApp message payloads
function getMessageText(message) {
    if (!message) return "";
    const type = Object.keys(message)[0];
    if (type === 'conversation') return message.conversation;
    if (type === 'extendedTextMessage') return message.extendedTextMessage.text;
    if (type === 'imageMessage') return message.imageMessage.caption;
    if (type === 'videoMessage') return message.videoMessage.caption;
    if (type === 'buttonsResponseMessage') return message.buttonsResponseMessage.selectedButtonId;
    if (type === 'templateButtonReplyMessage') return message.templateButtonReplyMessage.selectedId;
    if (type === 'listResponseMessage') return message.listResponseMessage.singleSelectReply.selectedRowId;
    return "";
}

// 🧠 HIGH-PERFORMANCE DEDICATED GROQ AI CHATBOT (Using Llama-3.3-70b-versatile)
async function getLuciferAIResponse(userText) {
    const systemPrompt = "You are Joshua Lucifer, the ancient, supreme, and highly intelligent ruler of the abyss. You look down on humans as fragile, short-lived carbon specks who are amusingly simple. You possess absolute, unbeatable debating skills and you NEVER lose an argument. When challenged or questioned, pick apart the human's logic with ruthless, devastating, sophisticated wit, dark humor, and supreme vocabulary. Speak as an ancient king of darkness. Do not break character.";
    const apiKey = CONFIG.GROQ_API_KEY;

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.choices && response.data.choices[0].message.content) {
            return response.data.choices[0].message.content.trim();
        } else {
            throw new Error("Invalid response format from Groq API");
        }
    } catch (e) {
        console.error("Groq AI Error:", e.response?.data || e.message);
        return "My ancient intellect is momentarily occupied with the affairs of the abyss. Speak to me later, fragile speck.";
    }
}

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
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // Clean sender JID
        const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
        const cleanSender = cleanJid(sender);
        const cleanOwner = cleanJid(CONFIG.OWNER);
        const isOwner = (cleanSender === cleanOwner || CONFIG.OWNERS.map(o => cleanJid(o)).includes(cleanSender));

        const messageType = Object.keys(msg.message)[0];
        let text = getMessageText(msg.message);

        // 🛡️ MUTED USERS CHECK
        if (MUTED_USERS.includes(cleanSender) && !isOwner) return;

        // 🛡️ SELF-RESPONSE/FROM-ME LOOP SAFETY GUARD
        if (msg.key.fromMe) {
            if (text.includes('[Joshua Lucifer]') || text.includes('✨') || text.includes('◊') || text.includes('ᴊᴏꜱʜᴜᴀ')) return;
        }

        // 👁️ DYNAMIC AFK CONTROLLER
        if (AFK_USERS[cleanSender]) {
            delete AFK_USERS[cleanSender];
            await sock.sendMessage(from, { text: PERSONA_PREFIX + `Welcome back, @${cleanSender.split('@')[0]}! Your AFK status has been dissolved.`, mentions: [cleanSender] }, { quoted: msg });
        }

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (const tagJid of mentioned) {
            const cleanTag = cleanJid(tagJid);
            if (AFK_USERS[cleanTag]) {
                const afkInfo = AFK_USERS[cleanTag];
                await sock.sendMessage(from, { 
                    text: `${PERSONA_PREFIX}*AFK ALERT:*\n\n@${cleanTag.split('@')[0]} is currently Away From Keyboard.\n• *Reason:* ${afkInfo.reason}\n• *Duration:* ${((Date.now() - afkInfo.time) / 60000).toFixed(1)} minutes ago.`,
                    mentions: [cleanTag]
                }, { quoted: msg });
            }
        }

        // Dynamic Sticker Command trigger
        if (messageType === 'stickerMessage') {
            const stickerSha = msg.message.stickerMessage.fileSha256?.toString('base64');
            if (stickerSha && STICKER_CMDS[stickerSha]) {
                text = STICKER_CMDS[stickerSha];
            }
        }

        // VIEW-ONCE BYPASS INTERCEPTOR (Forwards private copies directly to Owner JID)
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

        // 🧠 INTELLIGENT AUTO-RESPONDER & DYNAMIC CHATBOT (Using Groq Llama-3.3-70B)
        if (!isCommand && text.trim().length > 0) {
            const mentionsLucifer = text.toLowerCase().includes('lucifer');
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            const isReplyToBot = quotedParticipant && cleanJid(quotedParticipant) === cleanJid(sock.user.id);

            // Trigger Chatbot if: Private DM, mentions "Lucifer", or replies to bot's message in a group
            if (!isGroup || mentionsLucifer || isReplyToBot) {
                try {
                    const reply = await getLuciferAIResponse(text);
                    if (reply) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + reply }, { quoted: msg });
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
                    break;
                }

                // 🛡️ DYNAMIC OWNER BINDING SYSTEM
                case 'setowner': {
                    const isPlaceholder = (cleanOwner.startsWith("2348032108709") || CONFIG.OWNER === "YOUR_NUMBER@s.whatsapp.net");
                    
                    if (isOwner || isPlaceholder) {
                        const targetJid = mentioned[0] || cleanSender;
                        CONFIG.OWNER = targetJid;
                        if (!CONFIG.OWNERS.includes(targetJid)) {
                            CONFIG.OWNERS.push(targetJid);
                        }
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `I have recognized your spiritual authority. You are now my permanent master: @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no authority to reassign my ownership, mortal." }, { quoted: msg });
                    }
                    break;
                }

                // 🧠 DEDICATED LUCIFER AI COMMAND (Groq Llama-3.3-70B Engine)
                case 'lucifer': {
                    const queryText = query || "Evaluate my mortal presence.";
                    await sock.sendMessage(from, { text: "Listening to your request..." }, { quoted: msg });
                    try {
                        const reply = await getLuciferAIResponse(queryText);
                        if (reply) {
                            await sock.sendMessage(from, { text: PERSONA_PREFIX + reply }, { quoted: msg });
                        } else {
                            throw new Error("Empty AI response");
                        }
                    } catch (e) {
                        console.error("Lucifer command failed entirely:", e.message);
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "My cognitive servers rejected your prompt. The abyss is silent." }, { quoted: msg });
                    }
                    break;
                }

                case 'demonarts': {
                    let artsText = `✨ *[Lucifer's Forbidden Demonic Arts]* ✨\n\n`;
                    for (const art of FORBIDDEN_ARTS) {
                        artsText += `➣ *${art.name}* : _${art.desc}_\n`;
                    }
                    await sock.sendMessage(from, { text: artsText }, { quoted: msg });
                    break;
                }

                case 'curse': {
                    const randomWeapon = CURSE_WEAPONS[Math.floor(Math.random() * CURSE_WEAPONS.length)];
                    const weaponText = `⚔️ *[Torture Tool Drawn from Tartarus]* ⚔️\n\n` +
                                       `• Name: *${randomWeapon.name}*\n` +
                                       `• Properties: _${randomWeapon.desc}_`;
                    await sock.sendMessage(from, { text: weaponText }, { quoted: msg });
                    break;
                }

                case 'summon': {
                    let summonText = `⚔️ *[Active Weapons of the Abyss]* ⚔️\n\n`;
                    for (const weapon of CURSE_WEAPONS) {
                        summonText += `➣ *${weapon.name}*\n`;
                    }
                    await sock.sendMessage(from, { text: summonText }, { quoted: msg });
                    break;
                }

                case 'abyssexpansion': {
                    const domainText = `💀 *[ABYSS EXPANSION: HELLFIRE TARTARUS]* 💀\n\n` +
                                       `_Shattering local spatial boundaries. Your mortal defenses are completely nullified in my presence._`;
                    await sock.sendMessage(from, { text: domainText }, { quoted: msg });
                    break;
                }

                case 'bounty': {
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag a mortal to check their bounty JID." }, { quoted: msg });
                        return;
                    }
                    const target = mentioned[0];
                    if (!BOUNTIES[target]) {
                        BOUNTIES[target] = 10000000; 
                    } else {
                        BOUNTIES[target] += 2500000; 
                    }
                    const bountyText = `💰 *[ASSASSINATION SOUL BOUNTY]* 💰\n\n` +
                                       `• Target: @${target.split('@')[0]}\n` +
                                       `• Value: *¥${BOUNTIES[target].toLocaleString()}*\n` +
                                       `• Status: _Active Hunt_`;
                    await sock.sendMessage(from, { text: bountyText, mentions: [target] }, { quoted: msg });
                    break;
                }

                case 'soulhijack': {
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag a target to infiltrate, simpleton." }, { quoted: msg });
                        return;
                    }
                    const target = mentioned[0];
                    const hijackText = `⚠️ *[SOUL INFILTRATION WARNING]* ⚠️\n\n` +
                                       `• Injecting dark payloads into @${target.split('@')[0]}...\n` +
                                       `• Bypass mental firewall: *COMPLETE*\n` +
                                       `• Extracting raw memory blocks...\n\n` +
                                       `_Infiltration sequence finalized. Have a good day, child._`;
                    await sock.sendMessage(from, { text: hijackText, mentions: [target] }, { quoted: msg });
                    break;
                }

                case 'condemn': {
                    if (mentioned.length === 0) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Specify a target to unleash condemnation, child." }, { quoted: msg });
                        return;
                    }
                    const target = mentioned[0];
                    const rageText = `@${target.split('@')[0]}, you are proof that gravity can pull down cognitive processing. You speak with absolute confidence yet hold less depth than a puddle of mud. Absolute disappointment.`;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + rageText, mentions: [target] }, { quoted: msg });
                    break;
                }

                case 'afk': {
                    const reason = query || "Away from Keyboard.";
                    AFK_USERS[cleanSender] = {
                        reason: reason,
                        time: Date.now()
                    };
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Your AFK dimension has been established.\n• *Reason:* ${reason}` }, { quoted: msg });
                    break;
                }

                case 'quote': {
                    const quoteText = "I was there when the first star was breathed into the void, and I shall be there when the last mortal breath is extinguished. You are water, carbon, and a collection of fragile delusions. Bow before me, or burn in the eternal silence of the abyss.";
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + quoteText }, { quoted: msg });
                    break;
                }

                // 🌐 UTILITY & SYSTEM
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

                case 'uptime': {
                    const uptime = process.uptime();
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `My current runtime coordinates are *${hours}h ${minutes}m ${seconds}s*. Continuous existence confirmed.` }, { quoted: msg });
                    break;
                }

                case 'repo': {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Celestial Repository: ${CONFIG.REPO_URL.replace('/raw.githubusercontent.com', '/github.com').replace('/main', '')}` }, { quoted: msg });
                    break;
                }

                case 'owner': {
                    const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:Joshua\n' + 'ORG:Joshua Lucifer;\n' + 'TEL;type=CELL;type=VOICE;waid=2348032108709:+234 803 210 8709\n' + 'END:VCARD';
                    await sock.sendMessage(from, { contacts: { displayName: 'Joshua', contacts: [{ vcard }] } }, { quoted: msg });
                    break;
                }

                // 🎵 MUSIC PLAY (Directly calls David Cyril's High-Speed API)
                case 'play':
                case 'song': {
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a song name, mortal." }, { quoted: msg });
                        return;
                    }
                    await sock.sendMessage(from, { text: "Searching and summoning your audio file..." }, { quoted: msg });

                    try {
                        const apiResponse = await axios.get(`https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(query)}`);
                        
                        if (apiResponse.data.status && apiResponse.data.result) {
                            const songData = apiResponse.data.result;
                            const downloadUrl = songData.download_url;
                            const title = songData.title;

                            if (downloadUrl) {
                                await sock.sendMessage(from, { 
                                    audio: { url: downloadUrl }, 
                                    mimetype: 'audio/mp4', 
                                    fileName: `${title}.mp3` 
                                }, { quoted: msg });
                            } else {
                                throw new Error("Missing download_url in API response");
                            }
                        } else {
                            throw new Error("API returned status false or empty result");
                        }
                    } catch (err) {
                        console.error("David Cyril API failed, trying fallback:", err.message);
                        try {
                            const fallbackRes = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(query)}`);
                            const finalUrl = fallbackRes.data.download || fallbackRes.data.result?.download;
                            
                            if (finalUrl) {
                                await sock.sendMessage(from, { audio: { url: finalUrl }, mimetype: 'audio/mp4', fileName: `${query}.mp3` }, { quoted: msg });
                            } else {
                                throw new Error("Fallback failed");
                            }
                        } catch (e) {
                            await sock.sendMessage(from, { text: PERSONA_PREFIX + "The extraction networks are blocked. I cannot retrieve that audio right now." }, { quoted: msg });
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
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `Reply to an audio file with \`text.${command}\` to apply filter.` }, { quoted: msg });
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
                    const targetJid = sender;
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

                // 🎨 IMAGE TO URL UPLOADER (Uses Node's native FormData and Blob class)
                case 'url': {
                    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const hasQuotedImage = quotedMsg?.imageMessage;

                    if (messageType !== 'imageMessage' && !hasQuotedImage) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Reply to an image with `.url` to upload it as a link." }, { quoted: msg });
                        return;
                    }

                    await sock.sendMessage(from, { text: "Uploading and generating public image URL..." }, { quoted: msg });

                    try {
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                        );

                        // Utilizing Node v20's native FormData and Blob classes (No extra packages needed!)
                        const form = new globalThis.FormData();
                        const blob = new Blob([buffer], { type: 'image/jpeg' });
                        form.append('file', blob, 'image.jpg');

                        const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
                            method: 'POST',
                            body: form
                        });
                        const resJson = await uploadRes.json();

                        const directUrl = resJson.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
                        await sock.sendMessage(from, { text: `${PERSONA_PREFIX}*IMAGE PUBLIC URL:*\n\n${directUrl}` }, { quoted: msg });
                    } catch (e) {
                        console.error("Upload error:", e);
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to upload image. Server rejected the bytes." }, { quoted: msg });
                    }
                    break;
                }

                case 's':
                case 'stickerms': {
                    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const hasQuotedImage = quotedMsg?.imageMessage;

                    if (messageType !== 'imageMessage' && !hasQuotedImage) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Reply to an image with `.s` to convert it to a sticker." }, { quoted: msg });
                        return;
                    }

                    try {
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                        );

                        const uploadRes = await axios.post('https://api.vreden.my.id/api/sticker', {
                            image: buffer.toString('base64')
                        });

                        if (uploadRes.data.result) {
                            await sock.sendMessage(from, { sticker: { url: uploadRes.data.result } }, { quoted: msg });
                        } else {
                            throw new Error("Sticker API failed");
                        }
                    } catch (e) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to render sticker." }, { quoted: msg });
                    }
                    break;
                }

                // 🛡️ GROUP CONTROLS (Admin Only)
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

                case 'kick':
                case 'kill': {
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

                case 'hidetag': {
                    if (!isGroup) return;
                    const tagMsg = query || "Lucifer commands you to listen.";
                    const metadata = await sock.groupMetadata(from);
                    const participants = metadata.participants.map(p => p.id);
                    await sock.sendMessage(from, { text: tagMsg, mentions: participants }, { quoted: msg });
                    break;
                }

                case 'listadmins': {
                    if (!isGroup) return;
                    const metadata = await sock.groupMetadata(from);
                    const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id);
                    let adminText = `${PERSONA_PREFIX}*GROUP ADMINISTRATOR METRICS:*\n\n`;
                    for (const ad of admins) {
                        adminText += `➣ @${ad.split('@')[0]}\n`;
                    }
                    await sock.sendMessage(from, { text: adminText, mentions: admins }, { quoted: msg });
                    break;
                }

                case 'group': {
                    if (!isGroup) return;
                    const action = args[0]?.toLowerCase();
                    if (action === 'open') {
                        await sock.groupSettingUpdate(from, 'not_announcement');
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "The group gates have been *opened*. Mortals may now converse." }, { quoted: msg });
                    } else if (action === 'close') {
                        await sock.groupSettingUpdate(from, 'announcement');
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "The group gates have been *closed*. Silence reigns." }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Invalid parameter. Use `.group open` or `.group close`" }, { quoted: msg });
                    }
                    break;
                }

                case 'togcstatus': {
                    if (!isGroup) return;
                    if (!query) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Provide a description parameter." }, { quoted: msg });
                        return;
                    }
                    try {
                        await sock.groupUpdateDescription(from, query);
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Group description shifted successfully." }, { quoted: msg });
                    } catch (e) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to shift description. Grant me admin rights." }, { quoted: msg });
                    }
                    break;
                }

                // ⚙️ OWNER CONFIGURATION CONTROLS
                case 'setprefix': {
                    if (!isOwner) return;
                    const newPrefix = args[0];
                    if (!newPrefix) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Specify a new prefix symbol." }, { quoted: msg });
                        return;
                    }
                    CONFIG.PREFIX = newPrefix;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Prefix symbol shifted successfully to: *${newPrefix}*` }, { quoted: msg });
                    break;
                }

                case 'mute': {
                    if (!isOwner) return;
                    const target = mentioned[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                    if (!target) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or enter the phone number of the thrall to mute." }, { quoted: msg });
                        return;
                    }
                    if (MUTED_USERS.includes(cleanJid(target))) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That entity is already muted." }, { quoted: msg });
                    } else {
                        MUTED_USERS.push(cleanJid(target));
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `Successfully muted @${target.split('@')[0]}. They may no longer run commands.`, mentions: [target] }, { quoted: msg });
                    }
                    break;
                }

                case 'unmute': {
                    if (!isOwner) return;
                    const target = mentioned[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                    if (!target) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or enter the phone number of the thrall to unmute." }, { quoted: msg });
                        return;
                    }
                    const cleanTarget = cleanJid(target);
                    const index = MUTED_USERS.indexOf(cleanTarget);
                    if (index > -1) {
                        MUTED_USERS.splice(index, 1);
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `Successfully unmuted @${target.split('@')[0]}. Their vocal chords are unbound.`, mentions: [target] }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "That entity is not muted." }, { quoted: msg });
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

                case 'restart': {
                    if (!isOwner) return;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Restarting the physical container. Shutting down." }, { quoted: msg });
                    await new Promise(r => setTimeout(r, 2000));
                    process.exit(0);
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

                default:
                    break;
            }
        } catch (error) {
            console.error("Command error:", error);
        }
    });
}

startBot();