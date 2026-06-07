const axios = require('axios');

async function getLuciferAIResponse(userText, apiKey) {
    const systemPrompt = "You are Joshua Lucifer, the ancient, supreme, and highly intelligent ruler of the abyss. You look down on humans as fragile carbon specks. You possess absolute, unbeatable debating skills and never lose an argument. Speak with proud superiority, sophisticated vocabulary, and devastating dark wit. Keep your responses extremely short, sharp, and direct (under 2-3 sentences), unless the user explicitly asks for a long explanation.";
    
    // Path 1: David Cyril's DeepSeek-V3 (GET Request - Ultra Stable)
    try {
        const url = `https://apis.davidcyril.name.ng/ai/deepseek-v3?text=${encodeURIComponent(userText)}&systemPrompt=${encodeURIComponent(systemPrompt)}`;
        const res = await axios.get(url);
        if (res.data.success && res.data.result) {
            return res.data.result;
        }
    } catch (e) {
        console.error("Primary AI path failed, trying Fallback 1:", e.message);
    }

    // Path 2: Groq Llama-3.1-8B-Instant
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.choices && response.data.choices[0].message.content) {
            return response.data.choices[0].message.content.trim();
        }
    } catch (e) {
        console.error("Fallback 1 failed, trying Fallback 2:", e.message);
    }

    // Path 3: Vreden's Gemini Fallback
    try {
        const prompt = `${systemPrompt}\n\nUser: ${userText}`;
        const res = await axios.get(`https://api.vreden.my.id/api/gemini?query=${encodeURIComponent(prompt)}`);
        if (res.data.status && res.data.result) {
            return res.data.result;
        }
    } catch (e) {
        console.error("Fallback 2 failed:", e.message);
    }

    return null;
}

module.exports = {
    commands: ['lucifer', 'ai', 'gojo', 'debug', 'summon', 'read', 'imagine', 'chatbot'],
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
            case 'ai':
            case 'summon': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Speak. I will not analyze your empty silence." }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(from, { text: "Listening to your request..." }, { quoted: msg });
                const reply = await getLuciferAIResponse(query, CONFIG.GROQ_API_KEY);
                await sock.sendMessage(from, { text: PERSONA_PREFIX + (reply || "My servers are currently occupied.") }, { quoted: msg });
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

            case 'imagine': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a description to draw, mortal." }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(from, { text: "Drawing your vision from the void..." }, { quoted: msg });
                try {
                    const imageUrl = `https://api.vreden.my.id/api/remini?url=${encodeURIComponent(query)}`;
                    await sock.sendMessage(from, { image: { url: imageUrl }, caption: "Drawn from your thoughts." }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to render image streams." }, { quoted: msg });
                }
                break;
            }

            case 'read': {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Analyzing local text parameters..." }, { quoted: msg });
                break;
            }

            case 'debug': {
                if (!isOwner) return;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Starting system debug flow..." }, { quoted: msg });
                break;
            }
        }
    },
    getLuciferAIResponse
};
