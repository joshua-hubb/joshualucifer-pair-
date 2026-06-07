const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    commands: ['play', 'song'],
    execute: async (sock, msg, context) => {
        const { query, from, PERSONA_PREFIX } = context;
        if (!query) {
            await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a song name, mortal." }, { quoted: msg });
            return;
        }
        await sock.sendMessage(from, { text: "Searching and summoning your audio file..." }, { quoted: msg });

        try {
            // High-speed David Cyril API
            const apiResponse = await axios.get(`https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(query)}`);
            
            if (apiResponse.data.status && apiResponse.data.result) {
                const songData = apiResponse.data.result;
                const downloadUrl = songData.download_url;
                const title = songData.title;

                if (downloadUrl) {
                    await sock.sendMessage(from, { 
                        audio: { url: downloadUrl }, 
                        mimetype: 'audio/mp4', 
                        fileName: `${title}.mp3` 
                    }, { quoted: msg });
                } else {
                    throw new Error("Missing download_url");
                }
            } else {
                throw new Error("API returned status false");
            }
        } catch (err) {
            console.error("Primary Play failed, fallback to vreden:", err.message);
            try {
                // High-speed fallback
                const fallbackRes = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(query)}`);
                const finalUrl = fallbackRes.data.download || fallbackRes.data.result?.download;
                
                if (finalUrl) {
                    await sock.sendMessage(from, { audio: { url: finalUrl }, mimetype: 'audio/mp4', fileName: `${query}.mp3` }, { quoted: msg });
                } else {
                    throw new Error("Fallback failed");
                }
            } catch (e) {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "The extraction networks are blocked. I cannot retrieve that audio right now." }, { quoted: msg });
            }
        }
    }
};
