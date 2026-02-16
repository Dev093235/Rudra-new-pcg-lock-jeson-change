module.exports.config = {
  name: "pairfull",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Rudra Remix by Copilot",
  description: "Pair command with full profile pics",
  commandCategory: "love",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "jimp": ""
  }
};

async function makeImage({ one, two, name1, name2, shayari, rating }) {
  const fs = require("fs-extra");
  const axios = require("axios");
  const jimp = require("jimp");
  const path = require("path");
  const __root = path.resolve(__dirname, "cache", "canvas");

  const bgPath = __root + "/pairing.jpg";
  let pairing_img = await jimp.read(bgPath);

  const avatarOne = __root + `/avt_${one}.png`;
  const avatarTwo = __root + `/avt_${two}.png`;
  const pathImg = __root + `/pairing_${one}_${two}.png`;

  // Download full profile pics
  const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));

  const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));

  let imgOne = await jimp.read(avatarOne);
  let imgTwo = await jimp.read(avatarTwo);

  // Resize bigger for full profile
  imgOne.resize(250, 250);
  imgTwo.resize(250, 250);

  // Composite side by side
  pairing_img.composite(imgOne, 150, 100).composite(imgTwo, 450, 100);

  // Overlay text
  pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_32_WHITE), 200, 20, `💑 ${name1} ❤️ ${name2}`);
  pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_16_WHITE), 200, 370, shayari);
  pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_16_WHITE), 200, 400, `Compatibility: ${rating}`);

  const raw = await pairing_img.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

module.exports.run = async function ({ api, event, Users }) {
  const fs = require("fs-extra");

  const id1 = event.senderID;
  const name1 = await Users.getNameUser(id1);
  const threadInfo = await api.getThreadInfo(event.threadID);
  const all = threadInfo.participantIDs.filter(u => u !== id1 && u !== api.getCurrentUserID());

  if (all.length === 0) return api.sendMessage("❌ Koi jodi nahi mili bhai 😔", event.threadID);

  const id2 = all[Math.floor(Math.random() * all.length)];
  const name2 = await Users.getNameUser(id2);

  const shayaris = [
    "💫 Mohabbat inki taqdeer ban chuki hai 💖",
    "💘 In dono ki jodi pe rab bhi fakr kare 🙏",
    "🌟 Ishq bhi sharma jaaye inke aage 😍",
    "👑 Dil se dil ka milna yeh toh asmaanon ka rishta hai 🕊️",
    "🔥 Ruh ka milan hai yeh, sirf jism ka nahi 💑",
    "🌸 Inka rishta toh janmon ka hai 💍"
  ];
  const ratings = ["💘 100%", "💫 99.9%", "🔥 98%", "❤️ 101%", "🌟 97.5%", "👑 96.69%"];

  const shayari = shayaris[Math.floor(Math.random() * shayaris.length)];
  const rating = ratings[Math.floor(Math.random() * ratings.length)];

  return makeImage({ one: id1, two: id2, name1, name2, shayari, rating }).then(path =>
    api.sendMessage({
      body: `✨ Ye jodi likhi hai bhagwan ne ✨\n━━━━━━━━━━━━━━\n💑 ${name1} ❤️ ${name2}\n${shayari}\n❤️ Compatibility: ${rating}\n━━━━━━━━━━━━━━\n🔱 Powered by Rudra`,
      mentions: [{ id: id1, tag: name1 }, { id: id2, tag: name2 }],
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID)
  );
};
