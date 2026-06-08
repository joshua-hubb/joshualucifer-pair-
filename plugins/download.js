const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    commands: ['play', 'song', 'video', 'ytmp4', 'vid', 'tiktok', 'tt', 'facebook', 'fb'],
    execute: async (sock, msg, context) => {
        const { command, query, from, PERSONA_PREFIX } = context;

        switch (command) {
            case 'play':
            case 'song': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Give me a song name, mortal." }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(from, { text: "Searching and summoning your audio file..." }, { quoted: msg });

                try {
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
                            throw new Error();
                        }
                    } else {
                        throw new Error();
                    }
                } catch {
                    try {
                        const fallbackRes = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(query)}`);
                        const finalUrl = fallbackRes.data.download || fallbackRes.data.result?.download;
                        if (finalUrl) {
                            await sock.sendMessage(from, { audio: { url: finalUrl }, mimetype: 'audio/mp4', fileName: `${query}.mp3` }, { quoted: msg });
                        } else {
                            throw new Error();
                        }
                    } catch {
                        await sock.sendMessage(from, { text: PERSONA_PREFIX + "The extraction networks are blocked. I cannot retrieve that audio right now." }, { quoted: msg });
                    }
                }
                break;
            }

            case 'video':
            case 'ytmp4':
            case 'vid': {
                if (!query) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Provide a video name to search." }, { quoted: msg });
                    return;
                }
                const proc = await sock.sendMessage(from, { text: `_Searching for "${query}"..._` }, { quoted: msg });
                try {
                    const { data } = await axios.get(`https://ochinpo-helper.hf.space/yt?query=${encodeURIComponent(query)}`);
                    const result = data?.result;
                    const videoUrl = result?.download?.video;

                    if (!result || !videoUrl) {
                        return sock.sendMessage(from, { text: `❌ Video not found for "${query}".`, edit: proc.key });
                    }

                    await sock.sendMessage(from, { video: { url: videoUrl }, caption: `*${result.title}*` }, { quoted: msg });
                    await sock.sendMessage(from, { delete: proc.key });
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to retrieve the video stream.", edit: proc.key });
                }
                break;
            }

            case 'tiktok':
            case 'tt': {
                if (!query) {
                    return sock.sendMessage(from, { text: PERSONA_PREFIX + "Please provide a valid TikTok video link." }, { quoted: msg });
                }
                const proc = await sock.sendMessage(from, { text: "_Processing TikTok link..._" }, { quoted: msg });
                try {
                    let videoUrl = null;
                    try {
                        const apiResponse = await axios.post('https://api.tiklydown.eu.org/api/download', { url: query });
                        if (apiResponse.data && apiResponse.data.video && apiResponse.data.video.noWatermark) {
                            videoUrl = apiResponse.data.video.noWatermark;
                        }
                    } catch {}

                    if (!videoUrl) {
                        const apiResponse = await axios.get(`https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(query)}`);
                        if (apiResponse.data && apiResponse.data.status === 200 && apiResponse.data.tiktok?.video) {
                            videoUrl = apiResponse.data.tiktok.video;
                        }
                    }

                    if (videoUrl) {
                        await sock.sendMessage(from, { video: { url: videoUrl }, caption: "Extracted successfully." }, { quoted: msg });
                        await sock.sendMessage(from, { delete: proc.key });
                    } else {
                        throw new Error();
                    }
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to download the TikTok video.", edit: proc.key });
                }
                break;
            }

            case 'facebook':
            case 'fb': {
                if (!query) {
                    return sock.sendMessage(from, { text: PERSONA_PREFIX + "Please provide a valid Facebook video URL." }, { quoted: msg });
                }
                const proc = await sock.sendMessage(from, { text: "_Fetching video, please wait..._" }, { quoted: msg });
                try {
                    const response = await axios.get(`https://api.dreaded.site/api/facebook?url=${encodeURIComponent(query)}`);
                    const data = response.data;
                    const videoUrl = data?.facebook?.sdVideo || data?.facebook?.hdVideo;

                    if (videoUrl) {
                        await sock.sendMessage(from, { video: { url: videoUrl }, caption: "Downloaded successfully." }, { quoted: msg });
                        await sock.sendMessage(from, { delete: proc.key });
                    } else {
                        throw new Error();
                    }
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to download the Facebook video.", edit: proc.key });
                }
                break;
            }
        }
    }
};
