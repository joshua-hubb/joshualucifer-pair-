const { downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    commands: ['setpp', 'track', 'getpp', 'setname', 'save', 'tostatus', 'fw', 'presence', 'autotyping', 'autorecording', 'alwaysonline', 'autoread', 'antidelete', 'antidelete_log', 'antiviewonce', 'antibug', 'clear', 'archive', 'unarchive', 'autoviewstatus', 'statusemoji', 'autoreactstatus', 'block', 'unblock', 'aza', 'time', 'weather', 'device', 'livescore', 'football', 'url', 'tourl', 's', 'sticker', 'stickerms', 'remini', 'getgpp'],
    execute: async (sock, msg, context) => {
        const { command, from, messageType, PERSONA_PREFIX, cleanSender } = context;
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
                    let mediaMessage = msg;
                    if (quotedMsg) mediaMessage = { key: msg.key, message: quotedMsg };

                    const buffer = await downloadMediaMessage(
                        mediaMessage,
                        'buffer',
                        {},
                        { logger: pino({ level: 'silent' }), rekeydb: () => {} }
                    );

                    const mimeType = quotedMsg?.imageMessage?.mimetype || quotedMsg?.videoMessage?.mimetype || msg.message?.imageMessage?.mimetype || msg.message?.videoMessage?.mimetype || 'image/jpeg';
                    const ext = mimeType.split('/')[1] || 'jpg';

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
                        throw new Error("API failed");
                    }
                } catch (e) {
                    console.error("Upload API failed:", e);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to upload file." }, { quoted: msg });
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
                    let mediaMessage = msg;
                    if (quotedMsg) mediaMessage = { key: msg.key, message: quotedMsg };

                    const buffer = await downloadMediaMessage(
                        mediaMessage,
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
                        throw new Error();
                    }
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to render sticker." }, { quoted: msg });
                }
                break;
            }

            case 'getpp': {
                const targetJid = cleanSender;
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
                if (ppUrl) {
                    await sock.sendMessage(from, { image: { url: ppUrl }, caption: `Identity of @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "No profile photo configured." }, { quoted: msg });
                }
                break;
            }

            case 'getgpp': {
                const isGroup = from.endsWith('@g.us');
                if (!isGroup) return;
                const ppUrl = await sock.profilePictureUrl(from, 'image').catch(() => null);
                if (ppUrl) {
                    await sock.sendMessage(from, { image: { url: ppUrl }, caption: `Group banner.` }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "No group banner configured." }, { quoted: msg });
                }
                break;
            }
        }
    }
};
