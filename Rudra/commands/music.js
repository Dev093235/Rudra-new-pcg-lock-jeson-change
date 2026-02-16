module.exports.config = {
  name: "music",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Copilot Remix",
  description: "Play music by name",
  commandCategory: "music",
  cooldowns: 5,
  dependencies: {
    "ytdl-core": "",
    "yt-search": "",
    "fs-extra": "",
    "fluent-ffmpeg": "",
    "ffmpeg-static": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const ytdl = require("ytdl-core");
  const yts = require("yt-search");
  const fs = require("fs-extra");
  const ffmpeg = require("fluent-ffmpeg");
  const ffmpegPath = require("ffmpeg-static");

  const songName = args.join(" ");
  if (!songName) return api.sendMessage("🎵 Please type a song name!", event.threadID, event.messageID);

  try {
    // 🔍 Search YouTube
    const searchResults = await yts(songName);
    if (!searchResults.videos.length) return api.sendMessage("❌ No results found!", event.threadID, event.messageID);

    const video = searchResults.videos[0]; // first result
    const stream = ytdl(video.url, { filter: "audioonly" });
    const path = __dirname + `/cache/${event.senderID}.mp3`;

    // 📥 Convert to mp3 using ffmpeg
    ffmpeg(stream)
      .setFfmpegPath(ffmpegPath)
      .audioBitrate(128)
      .save(path)
      .on("end", () => {
        api.sendMessage({
          body: `🎶 Now playing: ${video.title}\n⏱ Duration: ${video.timestamp}\n📺 Link: ${video.url}`,
          attachment: fs.createReadStream(path)
        }, event.threadID, () => fs.unlinkSync(path), event.messageID);
      });

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Error while fetching music!", event.threadID, event.messageID);
  }
};
