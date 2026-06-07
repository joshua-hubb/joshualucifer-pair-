const fs = require('fs');
const path = require('path');
const jidNormalizedUser = require('@itsliaaa/baileys').jidNormalizedUser;

// Helper function to safely download a raw file from GitHub and overwrite the local copy
async function downloadFile(downloadUrl, localPath) {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Failed to download ${downloadUrl}`);
    const content = await res.text();
    fs.writeFileSync(localPath, content, 'utf-8');
}

// Recursive function to scan GitHub repository folders and sync them to the server
async function syncDirectory(repoPath = '') {
    // Connect to GitHub's Contents API
    const apiAddr = `https://api.github.com/repos/joshua-hubb/joshualucifer-pair-/contents/${repoPath}`;
    const res = await fetch(apiAddr, {
        headers: { 'User-Agent': 'Joshua-Lucifer-Updater' } // GitHub requires a User-Agent header
    });
    
    if (!res.ok) throw new Error(`GitHub API returned status ${res.status}`);
    const items = await res.json();

    for (const item of items) {
        // Skip hidden folders, server session files, and node modules to protect your login
        if (item.name.startsWith('.') || item.name === 'lucifer_auth_session' || item.name === 'node_modules' || item.name === 'yarn.lock' || item.name === 'package-lock.json') {
            continue;
        }

        // Resolves the local path. Moves up one directory out of /plugins/ into the root folder
        const localItemPath = path.join(__dirname, '..', item.path);

        if (item.type === 'file') {
            if (item.download_url) {
                await downloadFile(item.download_url, localItemPath);
                console.log(`[Joshua Lucifer Sync]: Downloaded ${item.path}`);
            }
        } else if (item.type === 'dir') {
            // If the directory does not exist on your server, create it automatically
            if (!fs.existsSync(localItemPath)) {
                fs.mkdirSync(localItemPath, { recursive: true });
            }
            // Recursively scan and download files inside the sub-directory
            await syncDirectory(item.path);
        }
    }
}

module.exports = {
    commands: ['update', 'restart', 'setowner', 'mode', 'addsudo', 'mute', 'unmute'],
    execute: async (sock, msg, context) => {
        const { command, args, from, query, PERSONA_PREFIX, CONFIG, isOwner, cleanSender, cleanJid } = context;
        const cleanOwner = cleanJid(CONFIG.OWNER);
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        switch (command) {
            // 🌐 CELESTIAL REPOSITORY SYNCHRONIZER (On-Demand GitHub Sync)
            case 'update': {
                if (!isOwner) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no authority to shift my configurations." }, { quoted: msg });
                    return;
                }

                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Synchronizing with the celestial vault... (Scanning GitHub for updates)" }, { quoted: msg });

                try {
                    // Triggers the recursive scanner from the root of your repository
                    await syncDirectory('');

                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Synchronization complete. All files updated. Restarting the engine to apply updates...\n\n_Note: If your host has auto-restart disabled, you may need to click 'Start' manually on your panel._" }, { quoted: msg });
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    process.exit(0);

                } catch (error) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `The celestial link shattered: ${error.message}` }, { quoted: msg });
                }
                break;
            }

            case 'restart': {
                if (!isOwner) return;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Restarting the physical container. Shutting down." }, { quoted: msg });
                await new Promise(r => setTimeout(r, 2000));
                process.exit(0);
                break;
            }

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

            case 'mute': {
                if (!isOwner) return;
                const target = mentioned[0] || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                if (!target) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or enter the phone number of the thrall to mute." }, { quoted: msg });
                    return;
                }
                if (context.MUTED_USERS.includes(cleanJid(target))) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "That entity is already muted." }, { quoted: msg });
                } else {
                    context.MUTED_USERS.push(cleanJid(target));
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
                const index = context.MUTED_USERS.indexOf(cleanTarget);
                if (index > -1) {
                    context.MUTED_USERS.splice(index, 1);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Successfully unmuted @${target.split('@')[0]}. Their vocal chords are unbound.`, mentions: [target] }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "That entity is not muted." }, { quoted: msg });
                }
                break;
            }
        }
    }
};
