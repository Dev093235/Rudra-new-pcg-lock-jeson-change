const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
  name: "music",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Mirrykal",
  description: "Download music from YouTube",
  commandCategory: "Media",
  usages: "[song name/url]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "yt-search": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length) {
    return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);
  }

  const apiKey = "apim_ycObVhoGor3PMoZkzFxNnqyKIwYo9Mr932yDyjZ8M9E"; // Hardcoded Key
  const input = args.join(" ");
  
  // Clean cache directory
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let videoUrl = input;
  let videoTitle = "";
  let videoDetails = {};
  let searchingMessageInfo = null;

  try {
    const isUrl = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)(\/|$)/.test(input);

    // --- 1. SEARCHING / GETTING INFO ---
    if (!isUrl) {
      searchingMessageInfo = await api.sendMessage(`🔍 Searching for: ${input}...`, threadID, messageID);
      const searchResult = await ytSearch(input);

      if (!searchResult || !searchResult.videos.length) {
        if (searchingMessageInfo) api.unsendMessage(searchingMessageInfo.messageID);
        return api.sendMessage("❌ Song not found on YouTube.", threadID, messageID);
      }

      const video = searchResult.videos[0];
      videoUrl = video.url;
      videoTitle = video.title;
      videoDetails = {
        duration: video.duration.timestamp,
        views: video.views,
        author: video.author.name,
        ago: video.ago,
        thumbnail: video.thumbnail || video.image 
      };
    } else {
      searchingMessageInfo = await api.sendMessage(`🔍 Processing URL...`, threadID, messageID);
      // URL se bhi basic info nikal lete hain taaki user ko thumbnail dikh sake
      try {
        const videoIdMatch = input.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/)|youtu\.be\/)([0-9A-Za-z_-]{11})/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            const searchResult = await ytSearch({ videoId: videoId });
            if (searchResult) {
                videoTitle = searchResult.title;
                videoDetails = {
                    duration: searchResult.duration.timestamp,
                    views: searchResult.views,
                    author: searchResult.author.name,
                    ago: searchResult.ago,
                    thumbnail: searchResult.image
                };
            }
        }
      } catch (e) {
          // Fallback agar search fail ho url ke liye
          videoTitle = "YouTube Video"; 
      }
    }

    // --- 2. SENDING THUMBNAIL & DETAILS ---
    let thumbPath = null;
    if (videoDetails.thumbnail) {
        try {
            const thumbFilename = `thumb_${Date.now()}.jpg`;
            thumbPath = path.join(cacheDir, thumbFilename);
            const thumbResponse = await axios.get(videoDetails.thumbnail, { responseType: "arraybuffer" });
            fs.writeFileSync(thumbPath, thumbResponse.data);
        } catch (err) {
            console.error("Thumbnail download failed", err);
        }
    }

    const formattedViews = videoDetails.views
      ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(videoDetails.views)
      : "N/A";

    let infoMsg = `🎵 Title: ${videoTitle}\n`;
    if (videoDetails.duration) infoMsg += `⏱ Duration: ${videoDetails.duration}\n`;
    if (videoDetails.author) infoMsg += `👤 Artist: ${videoDetails.author}\n`;
    if (videoDetails.views) infoMsg += `👀 Views: ${formattedViews}\n`;
    infoMsg += `⏳ Downloading audio...`;

    // Pehle info bhejte hain
    const infoMessage = { body: infoMsg };
    if (thumbPath) infoMessage.attachment = fs.createReadStream(thumbPath);

    await api.sendMessage(infoMessage, threadID, async () => {
        if (searchingMessageInfo) api.unsendMessage(searchingMessageInfo.messageID);
        if (thumbPath) fs.unlink(thumbPath, () => {}); // Delete thumb after sending
    }, messageID);


    // --- 3. CALLING DOWNLOAD API ---
    const apiUrl = "https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download";
    const response = await axios.post(
      apiUrl,
      { link: videoUrl, format: "mp3", videoQuality: "360" },
      { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
    );

    if (!response.data || !response.data.success || !response.data.data) {
      return api.sendMessage("❌ Failed to generate download link from API.", threadID, messageID);
    }

    const { downloadUrl, title, filename } = response.data.data;
    const finalTitle = videoTitle || title || "Unknown Title";

    // --- 4. FILE SIZE CHECK ---
    try {
      const headResponse = await axios.head(downloadUrl);
      const contentLength = headResponse.headers["content-length"];
      if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // Increased to 50MB for Mirai
        return api.sendMessage("❌ File size exceeds 50MB limit. Cannot send.", threadID, messageID);
      }
    } catch (headError) {
        // Ignore header check error, proceed to try downloading
    }

    // --- 5. DOWNLOADING MP3 ---
    const safeFilename = (filename || `${Date.now()}.mp3`).replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = path.join(cacheDir, safeFilename);
    const writer = fs.createWriteStream(filePath);

    const downloadResponse = await axios({
        method: "GET",
        url: downloadUrl,
        responseType: "stream"
    });

    downloadResponse.data.pipe(writer);

    writer.on("finish", () => {
      // Check if file is empty
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
          fs.unlinkSync(filePath);
          return api.sendMessage("❌ Download failed (empty file).", threadID, messageID);
      }

      // Send the Audio
      api.sendMessage(
        { 
            body: `🎧 ${finalTitle}`, 
            attachment: fs.createReadStream(filePath) 
        },
        threadID,
        (err) => {
          if (err) api.sendMessage("❌ Error sending audio file.", threadID, messageID);
          fs.unlink(filePath, () => {}); // Delete MP3 after sending
        },
        messageID
      );
    });

    writer.on("error", (err) => {
      api.sendMessage("❌ Failed to download the file stream.", threadID, messageID);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error("Error in music command:", error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
