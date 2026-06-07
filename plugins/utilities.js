const axios = require('axios');

const NOTES = {};

module.exports = {
    commands: ['ping', 'ping2', 'alive', 'delete', 'autoreact', 'speed', 'vv', 'sticker', 'crop', 'take', 'setcmd', 'delcmd', 'tovv', 'tourl', 'kamui', 'addnote', 'delnote', 'getnotes', 'getnote'],
    execute: async (sock, msg, context) => {
        const { command, from, query, args, PERSONA_PREFIX, isOwner, cleanSender } = context;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        switch (command) {
            case 'ping':
            case 'ping2':
            case 'speed': {
                const start = Date.now();
                await sock.sendMessage(from, { text: "Evaluating signal speed..." }, { quoted: msg });
                const end = Date.now();
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `Evaluation complete. Response speed: *${end - start}ms*` }, { quoted: msg });
                break;
            }

            case 'alive': {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Continuous existence confirmed. My systems are fully active." }, { quoted: msg });
                break;
            }

            case 'delete': {
                if (!isOwner) return;
                const key = {
                    remoteJid: from,
                    fromMe: true,
                    id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId
                };
                await sock.sendMessage(from, { delete: key });
                break;
            }

            case 'addnote': {
                const noteName = args[0];
                const noteContent = args.slice(1).join(' ');
                if (!noteName || !noteContent) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Usage: `.addnote [name] [content]`" }, { quoted: msg });
                    return;
                }
                NOTES[noteName] = noteContent;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `Note *${noteName}* saved successfully.` }, { quoted: msg });
                break;
            }

            case 'getnotes': {
                let noteList = `${PERSONA_PREFIX}*Active Note Archives:*\n\n`;
                for (const note of Object.keys(NOTES)) {
                    noteList += `➣ *${note}*\n`;
                }
                await sock.sendMessage(from, { text: noteList }, { quoted: msg });
                break;
            }

            case 'getnote': {
                const name = args[0];
                if (NOTES[name]) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `*Note [${name}]:*\n\n${NOTES[name]}` }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "No such note found." }, { quoted: msg });
                }
                break;
            }

            case 'delnote': {
                const name = args[0];
                if (NOTES[name]) {
                    delete NOTES[name];
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Note *${name}* deleted.` }, { quoted: msg });
                }
                break;
            }

            case 'kamui': {
                if (!isOwner) return;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "CASTING OUT ENTITY INTO THE ABYSS!" }, { quoted: msg });
                break;
            }
        }
    }
};
