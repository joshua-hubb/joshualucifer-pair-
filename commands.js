const fs = require('fs');
const path = require('path');
const jidNormalizedUser = require('@itsliaaa/baileys').jidNormalizedUser;

const plugins = {};
let getLuciferAIResponse = null;

// Dynamically read and load all files inside the /plugins directory on boot
const loadPlugins = () => {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        fs.mkdirSync(pluginsPath);
    }

    const files = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(pluginsPath, file))];
            const plugin = require(path.join(pluginsPath, file));
            
            if (plugin.commands) {
                for (const cmdName of plugin.commands) {
                    plugins[cmdName] = plugin.execute;
                }
            }
            if (plugin.getLuciferAIResponse) {
                getLuciferAIResponse = plugin.getLuciferAIResponse;
            }
            console.log(`[Joshua Lucifer]: Successfully loaded plugin: ${file}`);
        } catch (err) {
            console.error(`[Joshua Lucifer]: Failed to load plugin ${file}:`, err.message);
        }
    }
};

loadPlugins();

async function handleCommand(sock, msg, context) {
    const { text, command, isCommand, isGroup, cleanSender, from, CONFIG } = context;

    // 1. If it's a command, execute the matching plugin
    if (isCommand && plugins[command]) {
        try {
            context.getLuciferAIResponse = getLuciferAIResponse;
            await plugins[command](sock, msg, context);
        } catch (err) {
            console.error(`Error executing command .${command}:`, err);
        }
        return;
    }

    // 2. Chatbot Auto-Responder Logic with On/Off State Filter [1]
    if (!isCommand && text.trim().length > 0) {
        const mentionsLucifer = text.toLowerCase().includes('lucifer') || text.toLowerCase().includes('joshua');
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const isReplyToBot = quotedParticipant && (quotedParticipant.split(':')[0].split('@')[0].trim().toLowerCase() + '@s.whatsapp.net' === jidNormalizedUser(sock.user.id));

        // 🛡️ CHATBOT CONTROLLER BYPASS [1]
        // If CONFIG.CHATBOT is true, triggers on all private DMs. If false, it only triggers if they say "Lucifer/Joshua" or reply [1].
        const shouldTriggerAI = (CONFIG.CHATBOT && !isGroup) || mentionsLucifer || isReplyToBot;

        if (shouldTriggerAI && getLuciferAIResponse) {
            try {
                const reply = await getLuciferAIResponse(text, CONFIG.GROQ_API_KEY);
                if (reply) {
                    await sock.sendMessage(from, { text: context.PERSONA_PREFIX + reply }, { quoted: msg });
                }
            } catch (e) {
                console.error("AI Chatbot completely failed:", e.message);
            }
        }
    }
}

module.exports = { handleCommand };