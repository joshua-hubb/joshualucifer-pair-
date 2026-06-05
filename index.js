const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@itsliaaa/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// 💀 Your generated Session ID is pre-filled below:
const SESSION_ID = "GlobalTechInfo/MEGA-MD_47f8e70ec6f840e4c6b6d742c8ed2927";

const PERSONA_PREFIX = "✨ *[Joshua Lucifer]* ✨\n\n";

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

    // If the file already exists, skip downloading
    if (fs.existsSync(credsPath)) {
        return; 
    }

    if (!SESSION_ID) {
        console.log("[Joshua Lucifer]: No SESSION_ID configured in bot.js. Exiting.");
        process.exit(1);
    }

    console.log("==================================================");
    console.log("💀 [Joshua Lucifer]: Re-establishing the soul contract... (Downloading session keys)");
    console.log("==================================================");

    try {
        const gistId = SESSION_ID.replace('GlobalTechInfo/MEGA-MD_', '').trim();
        
        // Fetch the raw credentials from the secure GitHub API
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();
        
        // Find the credentials file inside the fetched data
        const files = Object.keys(data.files);
        const fileName = files.find(file => file.endsWith('.json'));
        
        if (!fileName) {
            throw new Error("No credential file found in your session ID.");
        }

        let credsContent = data.files[fileName].content.trim();

        // THE UNSCRAMBLER (Decodes the Base64 session string back to standard JSON)
        if (!credsContent.startsWith('{')) {
            credsContent = Buffer.from(credsContent, 'base64').toString('utf-8');
        }

        // Ensure directory exists
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir);
        }

        // Save the clean, decoded JSON file directly onto your host
        fs.writeFileSync(credsPath, credsContent, 'utf-8');
        console.log("💀 [Joshua Lucifer]: Soul contract verified. Session loaded successfully!\n");

    } catch (error) {
        console.error("💀 [Joshua Lucifer]: Failed to download session keys:", error.message);
        console.log("Please double-check your Session ID or run the pairing site again.\n");
        process.exit(1);
    }
}

async function startBot() {
    // Automatically retrieve and decode the session credentials before booting
    await downloadSession();

    const { state, saveCreds } = await useMultiFileAuthState('lucifer_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        version: version, // Matches the newest WhatsApp Web protocol
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
        const messageType = Object.keys(msg.message)[0];
        let text = "";
        
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'buttonsResponseMessage') {
            text = msg.message.buttonsResponseMessage.selectedButtonId;
        }

        if (!text.startsWith('.')) return;

        const args = text.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        try {
            switch (command) {
                case 'menu':
                case 'help': {
                    await sock.sendMessage(from, { 
                        text: PERSONA_PREFIX + "Must I spell out my powers to a mortal like you? Choose a command, fragile creature.", 
                        footer: "Joshua Lucifer v1.0", 
                        buttons: [
                            { text: 'Analyze Anatomy', id: '.table' },
                            { text: 'Acknowledge Me', id: '.hello' },
                            { text: 'Receive Roast', id: '.roast' }
                        ] 
                    }, { quoted: msg });
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
                    const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + randomRoast }, { quoted: msg });
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

                case 'announce': {
                    if (!from.endsWith('@g.us')) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "This command can only be executed within group parameters." }, { quoted: msg });
                        return;
                    }
                    const announcement = args.join(' ') || "Listen to me, insignificants!";
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `*ATTENTION REQUIRED:*\n\n${announcement}` }, { quoted: msg, mentionAll: true });
                    break;
                }

                default: {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Your command makes absolutely no sense. Use `.help` if you require me to simplify things." }, { quoted: msg });
                    break;
                }
            }
        } catch (error) {
            console.error("Command error:", error);
        }
    });
}

startBot();