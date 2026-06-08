const fs = require('fs');
const path = require('path');

const BAN_DB = path.join(__dirname, '..', 'ban.json');
const getBanList = () => {
    if (!fs.existsSync(BAN_DB)) fs.writeFileSync(BAN_DB, '[]', 'utf8');
    return JSON.parse(fs.readFileSync(BAN_DB, 'utf8'));
};
const saveBanList = (data) => fs.writeFileSync(BAN_DB, JSON.stringify(data, null, 2));

// Recursive function to scan GitHub repository folders and sync them to the server
async function syncDirectory(repoPath = '') {
    const apiAddr = `https://api.github.com/repos/joshua-hubb/joshualucifer-pair-/contents/${repoPath}`;
    const res = await fetch(apiAddr, {
        headers: { 'User-Agent': 'Joshua-Lucifer-Updater' }
    });
    
    if (!res.ok) throw new Error(`GitHub API returned status ${res.status}`);
    const items = await res.json();

    for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'lucifer_auth_session' || item.name === 'node_modules' || item.name === 'yarn.lock' || item.name === 'package-lock.json') {
            continue;
        }

        const localItemPath = path.join(__dirname, '..', item.path);

        if (item.type === 'file') {
            if (item.download_url) {
                const fileRes = await fetch(item.download_url);
                if (!fileRes.ok) throw new Error(`Failed to download ${item.path}`);
                const content = await fileRes.text();
                fs.writeFileSync(localItemPath, content, 'utf-8');
                console.log(`[Joshua Lucifer Sync]: Downloaded ${item.path}`);
            }
        } else if (item.type === 'dir') {
            if (!fs.existsSync(localItemPath)) {
                fs.mkdirSync(localItemPath, { recursive: true });
            }
            await syncDirectory(item.path);
        }
    }
}

module.exports = {
    commands: ['diagnose', 'update', 'mode', 'setsudo', 'delsudo', 'addowner', 'delowner', 'restart', 'shutdown', 'ban', 'unban', 'adddev', 'deldev', 'setvar', 'settings', 'setowner', 'setreportgroup'],
    execute: async (sock, msg, context) => {
        const { command, args, from, query, PERSONA_PREFIX, CONFIG, isOwner, cleanSender, cleanJid } = context;
        const cleanOwner = cleanJid(CONFIG.OWNER);
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        switch (command) {
            case 'update': {
                if (!isOwner) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no authority to shift my configurations." }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Synchronizing with the celestial vault... (Scanning GitHub)" }, { quoted: msg });
                try {
                    await syncDirectory('');
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Synchronization complete. Restarting the engine..." }, { quoted: msg });
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    process.exit(0);
                } catch (error) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `The celestial link shattered: ${error.message}` }, { quoted: msg });
                }
                break;
            }

            case 'restart': {
                if (!isOwner) return;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Rebooting core systems..." }, { quoted: msg });
                await new Promise(r => setTimeout(r, 2000));
                process.exit(0);
                break;
            }

            case 'shutdown': {
                if (!isOwner) return;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "The cycle of existence ends... shutting down." }, { quoted: msg });
                setTimeout(() => { process.exit(0); }, 1000);
                break;
            }

            case 'ban': {
                if (!isOwner) return;
                const target = mentioned[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Specify a user to banish." }, { quoted: msg });

                let banned = getBanList();
                const cleanTarget = cleanJid(target);
                if (banned.includes(cleanTarget)) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "That user is already banished." }, { quoted: msg });
                } else {
                    banned.push(cleanTarget);
                    saveBanList(banned);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `User @${target.split('@')[0]} has been permanently banned.`, mentions: [target] }, { quoted: msg });
                }
                break;
            }

            case 'unban': {
                if (!isOwner) return;
                const target = mentioned[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Specify a user to unban." }, { quoted: msg });

                let banned = getBanList();
                const cleanTarget = cleanJid(target);
                if (banned.includes(cleanTarget)) {
                    banned = banned.filter(u => u !== cleanTarget);
                    saveBanList(banned);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Banishment lifted for @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "That user is not banned." }, { quoted: msg });
                }
                break;
            }

            case 'setowner': {
                const isPlaceholder = (cleanOwner.startsWith("2348032108709") || CONFIG.OWNER === "YOUR_NUMBER@s.whatsapp.net");
                if (isOwner || isPlaceholder) {
                    const targetJid = mentioned[0] || cleanSender;
                    CONFIG.OWNER = targetJid;
                    if (!CONFIG.OWNERS.includes(targetJid)) CONFIG.OWNERS.push(targetJid);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `I have recognized your spiritual authority. Permanent master: @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no authority to reassign ownership." }, { quoted: msg });
                }
                break;
            }
        }
    }
};
