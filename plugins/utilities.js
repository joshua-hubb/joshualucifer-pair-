const axios = require('axios');
const googleTTS = require('google-tts-api');

const translationProviders = [
    {
        name: 'GoogleTranslate',
        getUrl: (text, lang) => `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`,
        parse: (data) => data?.[0]?.[0]?.[0]
    },
    {
        name: 'MyMemory',
        getUrl: (text, lang) => `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`,
        parse: (data) => data?.responseData?.translatedText
    }
];

module.exports = {
    commands: ['ping', 'ping2', 'alive', 'delete', 'autoreact', 'speed', 'vv', 'sticker', 'crop', 'take', 'setcmd', 'delcmd', 'tovv', 'tourl', 'kamui', 'addnote', 'delnote', 'getnotes', 'getnote', 'weather', 'weather2', 'w2', 'quote', 'translate', 'trt'],
    execute: async (sock, msg, context) => {
        const { command, from, query, args, PERSONA_PREFIX, isOwner, cleanSender } = context;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        switch (command) {
            case 'ping':
            case 'ping2':
            case 'speed': {
                const start = Date.now();
                await sock.sendMessage(from, { text: "Evaluating signal latency..." }, { quoted: msg });
                const end = Date.now();
                await sock.sendMessage(from, { text: PERSONA_PREFIX + `Response speed: *${end - start}ms*` }, { quoted: msg });
                break;
            }

            case 'alive': {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "My systems are fully active. Continuous existence confirmed." }, { quoted: msg });
                break;
            }

            case 'quote': {
                try {
                    const response = await axios.get('https://api.quotable.io/random');
                    const quoteResponse = `> "${response.data.content}"\n>\n> – *${response.data.author}*`;
                    await sock.sendMessage(from, { text: quoteResponse }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "The library of quotes is sealed." }, { quoted: msg });
                }
                break;
            }

            case 'weather':
            case 'weather2':
            case 'w2': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Provide a city name to search." }, { quoted: msg });
                    return;
                }
                try {
                    const res = await axios.get(`https://api.vreden.my.id/api/weather?city=${encodeURIComponent(query)}`);
                    if (res.data.status && res.data.result) {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + `*Weather Report for ${query}:*\n\n${res.data.result}` }, { quoted: msg });
                    }
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to consult the elements." }, { quoted: msg });
                }
                break;
            }

            case 'translate':
            case 'trt': {
                let textToTranslate = '';
                let lang = '';
                const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

                if (quotedText) {
                    textToTranslate = quotedText;
                    lang = args[0];
                } else {
                    lang = args.pop();
                    textToTranslate = args.join(' ');
                }

                if (!textToTranslate || !lang) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Usage: `.translate [lang] [text]` or reply with `.translate [lang]`" }, { quoted: msg });
                    return;
                }

                let translatedText = null;
                for (const provider of translationProviders) {
                    try {
                        const url = provider.getUrl(textToTranslate, lang);
                        const response = await axios.get(url, { timeout: 5000 });
                        const result = provider.parse(response.data);
                        if (result) {
                            translatedText = result;
                            break;
                        }
                    } catch {}
                }

                if (translatedText) {
                    await sock.sendMessage(from, { text: `*Translation:* ${translatedText}` }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "All translation pathways failed." }, { quoted: msg });
                }
                break;
            }
        }
    }
};
