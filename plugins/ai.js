const axios = require('axios');

async function getLuciferAIResponse(userText, apiKey) {
    // Custom system prompt instructing the AI to remain sharp and highly concise to bypass latency
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
    commands: ['lucifer', 'gpt', 'gemini', 'story'],
    execute: async (sock, msg, context) => {
        const { command, query, from, PERSONA_PREFIX, CONFIG } = context;
        if (!query) {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + "Speak. I will not analyze your empty silence." }, { quoted: msg });
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
    getLuciferAIResponse // Exported so commands.js can run it for the un-prefixed chatbot
};
