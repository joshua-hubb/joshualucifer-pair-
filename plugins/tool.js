const { downloadMediaMessage } = require('@itsliaaa/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    commands: ['url', 'tourl', 's', 'sticker', 'stickerms', 'getpp', 'getgpp', 'remini'],
    execute: async (sock, msg, context) => {
        const { command, from, messageType, PERSONA_PREFIX, cleanSender } = context;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        switch (command) {
            // 🎨 HIGH-SPEED IMAGE/VIDEO TO PUBLIC URL UPLOADER (Using David Cyril API over GET/POST)
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
                                        `• *Mime-Type:* ${resJson.data.mime}\n` +
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

            case 'getpp': {
                const targetJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || cleanSender;
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

            case 'remini': {
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
        }
    }
};
