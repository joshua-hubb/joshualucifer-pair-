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
const { handleCommand } = require('./commands'); // Separate command manager

// 💀 GLOBAL BOT CONFIGURATION
const CONFIG = {
    SESSION_ID: process.env.SESSION_ID || "GlobalTechInfo/MEGA-MD_47f8e70ec6f840e4c6b6d742c8ed2927",
    REPO_URL: "https://raw.githubusercontent.com/joshua-hubb/joshualucifer-pair-/main",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "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",
    OWNER: "2348032108709@s.whatsapp.net", 
    OWNERS: ["2348032108709@s.whatsapp.net"], 
    PRIVATE_MODE: false, 
    DM_ONLY: false,
    CHATBOT: true, // Dynamic Chatbot switch (On/Off)
    PREFIX: "."
};

const PERSONA_PREFIX = "✨ *[Joshua Lucifer]* ✨\n\n";
const BOUNTIES = {};
const AFK_USERS = {};
const MUTED_USERS = [];
const STICKER_CMDS = {};

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

const AUTO_RESPONSES = [
    "Did you call my name, fragile creature? Be careful. Uttering my name requires more cognitive processing than your primitive biology is accustomed to.",
    "Ah, a mortal seeks my gaze. How amusing. Speak, little speck of dust, before you return to the dirt from whence you came.",
    "You speak of me as if your simple mind can grasp the concept of eternity. Stick to your petty, fleeting mortal worries, insect.",
    "Yes, I am listening. Though listening to a human is like reading a child's crayon scribbles on a wall. Make it quick.",
    "Do not speak my name so casually, mortal. You are water, carbon, and a collection of fragile delusions. I am eternal."
];

// Helper to sanitize WhatsApp JIDs
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
            if (text.includes('[Joshua Lucifer]') || text.includes('✨') || text.includes('◊') || text.includes('ᴊᴏheader')) return;
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

        const isCommand = text.startsWith(CONFIG.PREFIX);
        const args = text.slice(CONFIG.PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const query = args.join(' ');

        // Setup unified context to hand off to separate commands.js file
        const context = {
            text,
            command,
            isCommand,
            isGroup,
            sender,
            cleanSender,
            isOwner,
            from,
            args,
            query,
            PERSONA_PREFIX,
            CONFIG,
            CURSE_WEAPONS,
            FORBIDDEN_ARTS,
            ROASTS,
            AFK_USERS,
            BOUNTIES,
            MUTED_USERS,
            STICKER_CMDS,
            downloadMediaMessage,
            cleanJid
        };

        // Pass control to commands.js
        await handleCommand(sock, msg, context);
    });
}

startBot();