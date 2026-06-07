const { downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    commands: ['setpp', 'track', 'getpp', 'setname', 'save', 'tostatus', 'fw', 'presence', 'autotyping', 'autorecording', 'alwaysonline', 'autoread', 'antidelete', 'antidelete_log', 'antiviewonce', 'antibug', 'clear', 'archive', 'unarchive', 'autoviewstatus', 'statusemoji', 'autoreactstatus', 'block', 'unblock', 'aza', 'time', 'weather', 'device', 'livescore', 'football', 'url', 's', 'sticker', 'stickerms', 'remini', 'getgpp'],
    execute: async (sock, msg, context) => {
        const { command, from, messageType, PERSONA_PREFIX, cleanSender, query, isOwner, cleanJid } = context;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        switch (command) {
            case 'url':
            case 'tourl': {
                const hasQuotedImage = quotedMsg?.imageMessage;
                const hasQuotedVideo = quotedMsg?.videoMessage;

                if (messageType !== 'imageMessage' && messageType !== 'videoMessage' && !hasQuotedImage && !hasQuotedVideo) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Reply to an image or video with `.tourl` to upload it as a link." }, { quoted: msg });
                    return;
                }

                await sock.sendMessage(from, { text: "Uploading and generating public direct link..." }, { quoted: msg });

                try {
                    const buffer = await downloadMediaMessage(
                        msg,
                        'buffer',
                        {},
                        { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                    );

                    const mimeType = quotedMsg?.imageMessage?.mimetype || quotedMsg?.videoMessage?.mimetype || msg.message?.imageMessage?.mimetype || msg.message?.videoMessage?.mimetype || 'image/jpeg';
                    const ext = mimeType.split('/')[1] || 'jpg';

                    // Utilizing Node's native FormData and Blob classes (No extra package downloads needed!)
                    const form = new globalThis.FormData();
                    const blob = new Blob([buffer], { type: mimeType });
                    form.append('file', blob, `file.${ext}`);

                    const uploadRes = await fetch('https://apis.davidcyril.name.ng/upload/imgbb', {
                        method: 'POST',
                        body: form
                    });
                    const resJson = await uploadRes.json();

                    if (resJson.success && resJson.data && resJson.data.url) {
                        const directUrl = resJson.data.url;
                        const details = `${PERSONA_PREFIX}*CELESTIAL LINK GENERATED:*\n\n` +
                                        `• *Filename:* ${resJson.data.filename}\n` +
                                        `• *Size:* ${(resJson.data.size / 1024).toFixed(1)} KB\n` +
                                        `• *Direct URL:* ${directUrl}`;
                        await sock.sendMessage(from, { text: details }, { quoted: msg });
                    } else {
                        throw new Error("API returned success false or empty URL");
                    }
                } catch (e) {
                    console.error("David Cyril Upload API failed:", e);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to upload file. The celestial vaults rejected the bytes." }, { quoted: msg });
                }
                break;
            }

            case 'weather': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Specify a city name, mortal." }, { quoted: msg });
                    return;
                }
                try {
                    const res = await axios.get(`https://api.vreden.my.id/api/weather?city=${encodeURIComponent(query)}`); // Uses free weather API
                    if (res.data.status && res.data.result) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `*Weather Report for ${query}:*\n\n${res.data.result}` }, { quoted: msg });
                    }
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to check weather coordinates." }, { quoted: msg });
                }
                break;
            }

            case 'time': {
                const now = new Date();
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `Temporal Coordinates: *${now.toLocaleTimeString()}* | *${now.toLocaleDateString()}*` }, { quoted: msg });
                break;
            }

            case 'getpp': {
                const targetJid = cleanSender;
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
                const isGroup = from.endsWith('@g.us');
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

            case 's':
            case 'sticker':
            case 'stickerms': {
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
        }
    }
};
