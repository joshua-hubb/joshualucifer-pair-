module.exports = {
    commands: ['gmode', 'kick', 'promote', 'demote', 'tagall', 'tag', 'link', 'antilink', 'admins', 'antitag', 'antibot', 'warn', 'togcstatus', 'getgpp', 'setpp', 'welcome', 'goodbye', 'delwelcome', 'delgoodbye', 'poll', 'antigm', 'gclog', 'creategc', 'tkick'],
    execute: async (sock, msg, context) => {
        const { command, from, query, args, PERSONA_PREFIX, isGroup, cleanJid } = context;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (!isGroup) {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + "This command can only be run in groups, mortal." }, { quoted: msg });
            return;
        }

        const metadata = await sock.groupMetadata(from);

        switch (command) {
            case 'groupinfo': {
                const infoText = `${PERSONA_PREFIX}*Group Analysis Metrics:*\n\n` +
                                 `• Name: *${metadata.subject}*\n` +
                                 `• Owner: @${metadata.owner?.split('@')[0]}\n` +
                                 `• Participants: *${metadata.participants.length}* mortals\n` +
                                 `• Description:\n${metadata.desc || "None provided"}`;
                await sock.sendMessage(from, { text: infoText, mentions: [metadata.owner] }, { quoted: msg });
                break;
            }

            case 'kick': {
                if (mentioned.length === 0) return;
                try {
                    await sock.groupParticipantsUpdate(from, [mentioned[0]], "remove");
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Cast out @${mentioned[0].split('@')[0]} into the abyss.` }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Coronet me with admin privileges first." }, { quoted: msg });
                }
                break;
            }

            case 'promote': {
                if (mentioned.length === 0) return;
                try {
                    await sock.groupParticipantsUpdate(from, [mentioned[0]], "promote");
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Thrall @${mentioned[0].split('@')[0]} has been elevated.` }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Coronet me with admin privileges first." }, { quoted: msg });
                }
                break;
            }

            case 'demote': {
                if (mentioned.length === 0) return;
                try {
                    await sock.groupParticipantsUpdate(from, [mentioned[0]], "demote");
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + `Admin @${mentioned[0].split('@')[0]} has been stripped of power.` }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Coronet me with admin privileges first." }, { quoted: msg });
                }
                break;
            }

            case 'tagall': {
                const participants = metadata.participants.map(p => p.id);
                let tagText = `${PERSONA_PREFIX}*ATTENTION ALL THRALLS:*\n\n`;
                for (const mem of participants) {
                    tagText += `➣ @${mem.split('@')[0]}\n`;
                }
                await sock.sendMessage(from, { text: tagText, mentions: participants }, { quoted: msg });
                break;
            }

            case 'link': {
                try {
                    const code = await sock.groupInviteCode(from);
                    await sock.sendMessage(from, { text: `${PERSONA_PREFIX}*Group Invitation Link:*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Make me admin to retrieve invite link." }, { quoted: msg });
                }
                break;
            }
        }
    }
};
