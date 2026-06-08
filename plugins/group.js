const fs = require('fs');
const path = require('path');

const WARN_DB = path.join(__dirname, '..', 'warns.json');
const WELCOME_DB = path.join(__dirname, '..', 'welcome.json');
const ANTILINK_DB = path.join(__dirname, '..', 'antilink.json');

const getDB = (file) => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '{}', 'utf8');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};
const saveDB = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

module.exports = {
    commands: ['gmode', 'kick', 'kill', 'promote', 'demote', 'tagall', 'tag', 'link', 'antilink', 'admins', 'antitag', 'antibot', 'warn', 'checkwarns', 'resetwarns', 'togcstatus', 'getgpp', 'setpp', 'welcome', 'goodbye', 'delwelcome', 'delgoodbye', 'poll', 'antigm', 'gclog', 'creategc', 'tkick'],
    execute: async (sock, msg, context) => {
        const { command, from, query, args, PERSONA_PREFIX, isGroup, cleanJid } = context;
        const quotedMsgInfo = msg.message?.extendedTextMessage?.contextInfo;
        const mentioned = quotedMsgInfo?.mentionedJid || [];
        const quotedParticipant = quotedMsgInfo?.participant; // The sender of the replied-to message [1]

        if (!isGroup) {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + "This command can only be executed within group parameters." }, { quoted: msg });
            return;
        }

        const metadata = await sock.groupMetadata(from);
        const botJid = cleanJid(sock.user.id);
        const isBotAdmin = metadata.participants.find(p => cleanJid(p.id) === botJid)?.admin;

        // 💀 TARGET ACQUISITION: Detects mentions first, then automatically falls back to replied-to user JID [1]
        const target = mentioned[0] || quotedParticipant || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);

        switch (command) {
            case 'groupinfo': {
                const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
                const infoText = `${PERSONA_PREFIX}*Group Analysis Metrics:*\n\n` +
                                 `• Name: *${metadata.subject}*\n` +
                                 `• Owner: @${metadata.owner?.split('@')[0]}\n` +
                                 `• Participants: *${metadata.participants.length}* mortals\n` +
                                 `• Description:\n${metadata.desc || "None provided"}`;
                await sock.sendMessage(from, { text: infoText, mentions: [metadata.owner, ...admins] }, { quoted: msg });
                break;
            }

            case 'kick':
            case 'kill': {
                if (!isBotAdmin) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Make me admin to pass judgment." }, { quoted: msg });
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or reply to the pest to banish." }, { quoted: msg });
                
                await sock.groupParticipantsUpdate(from, [target], "remove");
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `The pest @${target.split('@')[0]} has been cast out into the dark.`, mentions: [target] }, { quoted: msg });
                break;
            }

            case 'promote': {
                if (!isBotAdmin) return sock.sendMessage(from, { text: PERSONA_PREFIX + "I cannot promote without administrative authority." }, { quoted: msg });
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or reply to the thrall to promote." }, { quoted: msg });

                await sock.groupParticipantsUpdate(from, [target], "promote");
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `The thrall @${target.split('@')[0]} has been elevated to Admin.`, mentions: [target] }, { quoted: msg });
                break;
            }

            case 'demote': {
                if (!isBotAdmin) return sock.sendMessage(from, { text: PERSONA_PREFIX + "I cannot demote without administrative authority." }, { quoted: msg });
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or reply to the admin to demote." }, { quoted: msg });

                await sock.groupParticipantsUpdate(from, [target], "demote");
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `The admin @${target.split('@')[0]} has been returned to the masses.`, mentions: [target] }, { quoted: msg });
                break;
            }

            case 'tagall':
            case 'hidetag': {
                const participants = metadata.participants.map(p => p.id);
                const tagMsg = query || "Joshua Lucifer demands your attention.";
                if (command === 'tagall') {
                    let tagText = `${PERSONA_PREFIX}*ATTENTION ALL THRALLS:*\n_${tagMsg}_\n\n`;
                    tagText += participants.map(p => `• @${p.split('@')[0]}`).join('\n');
                    await sock.sendMessage(from, { text: tagText, mentions: participants });
                } else {
                    await sock.sendMessage(from, { text: tagMsg, mentions: participants });
                    await sock.sendMessage(from, { delete: msg.key });
                }
                break;
            }

            case 'link': {
                if (!isBotAdmin) return sock.sendMessage(from, { text: PERSONA_PREFIX + "I must be an admin to retrieve the invite link." }, { quoted: msg });
                const code = await sock.groupInviteCode(from);
                await sock.sendMessage(from, { text: `${PERSONA_PREFIX}*Group Portal Link:*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
                break;
            }

            case 'warn': {
                if (!isBotAdmin) return sock.sendMessage(from, { text: PERSONA_PREFIX + "I must be an admin to issue warnings." }, { quoted: msg });
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or reply to a mortal to warn them." }, { quoted: msg });

                let warns = getDB(WARN_DB);
                if (!warns[from]) warns[from] = {};
                warns[from][target] = (warns[from][target] || 0) + 1;
                saveDB(WARN_DB, warns);

                let warnCount = warns[from][target];
                let warnText = `${PERSONA_PREFIX}*Warning Issued!* ⚠️\n\n@${target.split('@')[0]} has been warned.\n*Total Warnings:* ${warnCount}/3`;

                if (warnCount >= 3) {
                    warnText += `\n\n*Final Judgment!* The user has been banished from the group.`;
                    await sock.sendMessage(from, { text: warnText, mentions: [target] }, { quoted: msg });
                    await sock.groupParticipantsUpdate(from, [target], "remove");
                    delete warns[from][target];
                    saveDB(WARN_DB, warns);
                } else {
                    await sock.sendMessage(from, { text: warnText, mentions: [target] }, { quoted: msg });
                }
                break;
            }

            case 'checkwarns': {
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or reply to a mortal to check warnings." }, { quoted: msg });
                const warns = getDB(WARN_DB);
                const count = warns[from]?.[target] || 0;
                await sock.sendMessage(from, { text: `${PERSONA_PREFIX}@${target.split('@')[0]} currently has *${count}* warning(s).`, mentions: [target] }, { quoted: msg });
                break;
            }

            case 'resetwarns': {
                if (!target) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Tag or reply to a mortal to reset warnings." }, { quoted: msg });
                const warns = getDB(WARN_DB);
                if (warns[from]?.[target]) {
                    delete warns[from][target];
                    saveDB(WARN_DB, warns);
                }
                await sock.sendMessage(from, { text: `${PERSONA_PREFIX}Warnings reset for @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
                break;
            }

            case 'antilink': {
                const option = args[0]?.toLowerCase();
                let antilink = getDB(ANTILINK_DB);
                if (option === 'on') {
                    antilink[from] = true;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Antilink *activated*. No external links will be tolerated." }, { quoted: msg });
                } else if (option === 'off') {
                    delete antilink[from];
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Antilink *deactivated*." }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: "Usage: `.antilink <on|off>`" }, { quoted: msg });
                }
                saveDB(ANTILINK_DB, antilink);
                break;
            }

            case 'welcome': {
                const option = args[0]?.toLowerCase();
                let welcome = getDB(WELCOME_DB);
                if (option === 'on') {
                    welcome[from] = { enabled: true, message: "Welcome {user} to {groupName}!" };
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Welcome messages *enabled*." }, { quoted: msg });
                } else if (option === 'off') {
                    delete welcome[from];
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Welcome messages *disabled*." }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: "Usage: `.welcome <on|off>`" }, { quoted: msg });
                }
                saveDB(WELCOME_DB, welcome);
                break;
            }
        }
    }
};
