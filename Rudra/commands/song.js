const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "song",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "ChatGPT PRO FIX",
    description: "Ultra fast song downloader 🎧",
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) {
        return api.sendMessage("❌ Song name daal bhai", threadID, messageID);
    }

    const query = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    let loadingMsg;

    try {
        api.setMessageReaction("⌛", messageID, () => {}, true);
        loadingMsg = await api.sendMessage("🔍 Song dhund raha hu...", threadID);

        // 🔎 Search YouTube
        const search = await ytSearch(query);
        if (!search.videos.length) {
            throw new Error("Song nahi mila");
        }

        const video = search.videos[0];
        const videoUrl = video.url;

        let downloadLink;

        // 🥇 METHOD 1 (Vevioz)
        try {
            const res = await axios.get(`https://api.vevioz.com/api/button/mp3?url=${encodeURIComponent(videoUrl)}`);
            downloadLink = res.data.match(/href="(.*?)"/)[1];
        } catch {
            console.log("Vevioz fail, trying backup...");
        }

        // 🥈 METHOD 2 (Backup API)
        if (!downloadLink) {
            try {
                const res = await axios.get(`https://vihangayt.me/download/mp3?url=${encodeURIComponent(videoUrl)}`);
                downloadLink = res.data.link;
            } catch {
                console.log("Backup API bhi fail");
            }
        }

        if (!downloadLink) {
            throw new Error("Download link nahi mila");
        }

        // 📥 Download
        const writer = fs.createWriteStream(filePath);

        const stream = await axios({
            url: downloadLink,
            method: "GET",
            responseType: "stream",
            timeout: 30000
        });

        stream.data.pipe(writer);

        writer.on("finish", async () => {

            const msg =
`╭─❍ 🎧 SONG DOWNLOADED ❍
│
│ 🖤 Title: ${video.title}
│ ⏱ Duration: ${video.timestamp}
│ 👤 Artist: ${video.author.name}
│ 👁 Views: ${video.views}
│
╰─➤ 🥀 YE LO BABY APKI SONG 💖`;

            await api.sendMessage(msg, threadID);

            api.sendMessage({
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                api.setMessageReaction("✅", messageID, () => {}, true);

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });
        });

        writer.on("error", () => {
            throw new Error("Download fail ho gaya");
        });

    } catch (err) {
        console.error(err);
        api.setMessageReaction("❌", messageID, () => {}, true);

        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

        api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};
