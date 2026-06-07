const axios = require('axios');

async function getLuciferAIResponse(userText, apiKey) {
    const systemPrompt = "You are Joshua Lucifer, the ancient, supreme, and highly intelligent ruler of the abyss. You look down on humans as fragile carbon specks. You possess absolute, unbeatable debating skills and never lose an argument. Speak with proud superiority, sophisticated vocabulary, and devastating dark wit. Keep your responses extremely short, sharp, and direct (under 2-3 sentences), unless the user explicitly asks for a long explanation.";
    
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant", // Blazing fast sub-second generation model on Groq!
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
        console.error("Groq AI Error:", e.message);
    }
    return null;
}

module.exports = {
    commands: ['lucifer', 'gpt', 'gemini', 'story', 'gojo', 'chatbot'],
    execute: async (sock, msg, context) => {
        const { command, query, args, from, PERSONA_PREFIX, CONFIG, isOwner } = context;

        // 🛡️ CHATBOT ON/OFF CONTROLLER
        if (command === 'chatbot') {
            if (!isOwner) {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "You hold no keys to my conversational matrices, worm." }, { quoted: msg });
                return;
            }
            const action = args[0]?.toLowerCase();
            if (action === 'on') {
                CONFIG.CHATBOT = true;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Chatbot mode *activated*. I will now respond automatically to all private messages." }, { quoted: msg });
            } else if (action === 'off') {
                CONFIG.CHATBOT = false;
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Chatbot mode *deactivated*. I will now only respond if you mention my name ('Lucifer' or 'Joshua') [1]." }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Invalid parameter. Use `.chatbot on` or `.chatbot off` [1]." }, { quoted: msg });
            }
            return;
        }

        if (!query) {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + "Speak. I will not analyze your empty silence." }, { quoted: msg });
            return;
        }

        if (command === 'gojo') {
            await sock.sendMessage(from, { text: "Gojo Satoru is responding..." }, { quoted: msg });
            try {
                const prompt = `You are Gojo Satoru, the strongest modern sorcerer from JJK, arrogant, playful, incredibly confident, and lazy. Answer this query directly: ${query}`;
                const reply = await getLuciferAIResponse(prompt, CONFIG.GROQ_API_KEY);
                await sock.sendMessage(from, { text: `🔵 *[Gojo Satoru]* 🔵\n\n` + reply }, { quoted: msg });
            } catch (e) {
                await sock.sendMessage(from, { text: "Gojo ignored your request. He is currently eating mochi." }, { quoted: msg });
            }
            return;
        }

        await sock.sendMessage(from, { text: "Listening to your request..." }, { quoted: msg });
        const reply = await getLuciferAIResponse(query, CONFIG.GROQ_API_KEY);
        if (reply) {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + reply }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + "My cognitive servers rejected your prompt." }, { quoted: msg });
        }
    },
    getLuciferAIResponse
};