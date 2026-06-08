const axios = require('axios');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getLuciferAIResponse(userText, apiKey) {
    const systemPrompt = "You are Joshua Lucifer, the ancient, supreme, and highly intelligent ruler of the abyss. You look down on humans as fragile carbon specks. You possess absolute, unbeatable debating skills and never lose an argument. Speak with proud superiority, sophisticated vocabulary, and devastating dark wit. Keep your responses extremely short, sharp, and direct (under 2-3 sentences), unless the user explicitly asks for a long explanation.";
    try {
        const url = `https://apis.davidcyril.name.ng/ai/deepseek-v3?text=${encodeURIComponent(userText)}&systemPrompt=${encodeURIComponent(systemPrompt)}`;
        const res = await axios.get(url);
        if (res.data.success && res.data.result) return res.data.result;
    } catch (e) {
        console.error("Primary AI path failed, trying Fallback 1:", e.message);
    }
    try {
        const prompt = `${systemPrompt}\n\nUser: ${userText}`;
        const res = await axios.get(`https://api.vreden.my.id/api/gpt4?query=${encodeURIComponent(prompt)}`);
        if (res.data.status && res.data.result) return res.data.result;
    } catch (e) {
        console.error("Fallback 1 failed, trying Fallback 2:", e.message);
    }
    try {
        const prompt = `${systemPrompt}\n\nUser: ${userText}`;
        const res = await axios.get(`https://api.vreden.my.id/api/gemini?query=${encodeURIComponent(prompt)}`);
        if (res.data.status && res.data.result) return res.data.result;
    } catch (e) {
        console.error("Fallback 2 failed:", e.message);
    }
    return null;
}

module.exports = {
    commands: ['lucifer', 'ai', 'gojo', 'chatbot', 'ask', 'bard', 'story', 'gen'],
    execute: async (sock, msg, context) => {
        const { command, query, args, from, PERSONA_PREFIX, CONFIG, isOwner } = context;

        switch (command) {
            case 'chatbot': {
                if (!isOwner) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no keys to my conversational matrices, worm." }, { quoted: msg });
                    return;
                }
                const action = args[0]?.toLowerCase();
                if (action === 'on') {
                    CONFIG.CHATBOT = true;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Chatbot mode *activated*." }, { quoted: msg });
                } else if (action === 'off') {
                    CONFIG.CHATBOT = false;
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Chatbot mode *deactivated* [1]." }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Use `.chatbot on` or `.chatbot off` [1]." }, { quoted: msg });
                }
                break;
            }

            case 'lucifer':
            case 'ai': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Speak. I will not analyze your empty silence." }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(from, { text: "Listening to your request..." }, { quoted: msg });
                const reply = await getLuciferAIResponse(query, CONFIG.GROQ_API_KEY);
                await sock.sendMessage(from, { text: PERSONA_PREFIX + (reply || "My servers are currently occupied.") }, { quoted: msg });
                break;
            }

            case 'ask': {
                if (!query) return sock.sendMessage(from, { text: PERSONA_PREFIX + "What knowledge do you seek?" }, { quoted: msg });
                await sock.sendMessage(from, { text: "Consulting the oracle..." }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://api.gurusensei.workers.dev/llama?prompt=${encodeURIComponent(query)}`);
                    const ans = data?.response?.response || "The oracle is silent.";
                    await sock.sendMessage(from, { text: `${PERSONA_PREFIX}*Oracle's Whisper:*\n\n${ans.trim()}` }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "The oracle is currently unresponsive." }, { quoted: msg });
                }
                break;
            }

            case 'bard': {
                if (!query) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Speak your query to Bard." }, { quoted: msg });
                await sock.sendMessage(from, { text: "Bard is processing..." }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://api.diioffc.web.id/api/ai/bard?query=${encodeURIComponent(query)}`);
                    const ans = data.result?.message || "Bard has no answer for you.";
                    await sock.sendMessage(from, { text: `${PERSONA_PREFIX}*Bard:* ${ans}` }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Bard's connection has been disrupted." }, { quoted: msg });
                }
                break;
            }

            case 'gojo': {
                if (!query) return;
                await sock.sendMessage(from, { text: "Gojo Satoru is responding..." }, { quoted: msg });
                try {
                    const prompt = `You are Gojo Satoru from JJK, arrogant, playful, incredibly confident, and lazy. Answer this directly: ${query}`;
                    const reply = await getLuciferAIResponse(prompt, CONFIG.GROQ_API_KEY);
                    await sock.sendMessage(from, { text: `🔵 *[Gojo Satoru]* 🔵\n\n` + reply }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { text: "Gojo ignored your request." }, { quoted: msg });
                }
                break;
            }

            case 'story': {
                if (!query) return sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a theme for your dark tale." }, { quoted: msg });
                await sock.sendMessage(from, { text: "Weaving your dark tale..." }, { quoted: msg });
                try {
                    const prompt = `Write a short, gothic, creepy, and beautiful horror story about: ${query}`;
                    const reply = await getLuciferAIResponse(prompt, CONFIG.GROQ_API_KEY);
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + reply }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "The void is currently silent." }, { quoted: msg });
                }
                break;
            }

            case 'gen': {
                if (!query) {
                    return sock.sendMessage(from, { text: PERSONA_PREFIX + "You must provide a description for the image generation." }, { quoted: msg });
                }
                const proc = await sock.sendMessage(from, { text: "Forging your vision in the digital realm..." }, { quoted: msg });
                try {
                    const generateResponse = await axios.get(`https://api.prodia.com/v1/sd/generate`, {
                        params: { prompt: query, model: 'v1-5-pruned-emaonly.safetensors [d7049739]' }
                    });
                    const jobId = generateResponse.data.job;
                    if (!jobId) throw new Error();

                    let imageUrl = null;
                    for (let attempts = 0; attempts < 20; attempts++) {
                        await sleep(2000);
                        const jobResponse = await axios.get(`https://api.prodia.com/v1/job/${jobId}`);
                        if (jobResponse.data.status === 'succeeded') {
                            imageUrl = jobResponse.data.imageUrl;
                            break;
                        }
                    }
                    if (imageUrl) {
                        await sock.sendMessage(from, { image: { url: imageUrl }, caption: `*Vision Realized:*\n_"${query}"_` }, { quoted: msg });
                        await sock.sendMessage(from, { delete: proc.key });
                    } else {
                        throw new Error();
                    }
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to generate image. The art spirits are displeased.", edit: proc.key });
                }
                break;
            }
        }
    },
    getLuciferAIResponse
};
