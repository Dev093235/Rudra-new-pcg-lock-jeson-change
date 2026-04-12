const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "song",
    version: "1.6.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download music with reactions and custom formatting",
    commandCategory: "Media",
    usages: "[song name/URL]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 API KEY
    const PRIYANSHU_API_KEY = "apim_fVhEYMjZPUPL8fnqdUbCC8ulPA03BCgsKons2zpASIc"; 

    if (!args.length) {
        return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);
    }

    const input = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    const fileName = `${Date.now()}.mp3`;
    const cachePath = path.join(cacheDir, fileName);

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg;
    try {
        // 1. Initial Reaction (Loading)
        api.setMessageReaction("⌛", messageID, (err) => {}, true);

        // Status Message
        processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

        // 2. YouTube Search
        const searchResult = await ytSearch(input);
        if (!searchResult || !searchResult.videos.length) {
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            return api.sendMessage("❌ Song not found.", threadID, messageID);
        }
        const video = searchResult.videos[0];
        const videoUrl = video.url;

        // 3. Calling API
        const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
        const response = await axios.post(apiUrl, {
            url: videoUrl,
            format: "mp3",
            quality: "320"
        }, {
            headers: {
                'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const data = response.data.data;
        if (!data || !data.downloadUrl) {
            throw new Error("Download link not found.");
        }

        // 4. Formatting Message (Title/Artist with Gap + Your Footer)
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉SONG`;

        await api.sendMessage(infoMsg, threadID);

        // 5. Optimized Download
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
            url: data.downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const stats = fs.statSync(cachePath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            if (fileSizeInMB > 48) {
                api.setMessageReaction("❌", messageID, (err) => {}, true);
                api.sendMessage(`⚠️ Song size (${fileSizeInMB.toFixed(2)}MB) is too large.`, threadID, messageID);
                return fs.unlinkSync(cachePath);
            }

            // Send Audio File
            api.sendMessage({
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                // Final Reaction (Done)
                api.setMessageReaction("✅", messageID, (err) => {}, true);

                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                if (processingMsg) api.unsendMessage(processingMsg.messageID);
            });
        });

        writer.on("error", (err) => { throw err; });

    } catch (error) {
        console.error(error);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Failed: ${error.message}`, threadID, messageID);
    }
};
