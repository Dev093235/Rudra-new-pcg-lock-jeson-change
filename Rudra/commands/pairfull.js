module.exports.config = {
  name: "pairfull",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Rudra Remix by Copilot",
  description: "Pair command with magical collage style",
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

  // Background from Postimage
  const bgURL = "https://i.postimg.cc/65x1Q2Wx/image-1771265751438.jpg";
  let pairing_img = await jimp.read(bgURL);

  const avatarOne = `avt_${one}.png`;
  const avatarTwo = `avt_${two}.png`;
  const pathImg = `pairing_${one}_${two}.png`;

  // Download profile pics
  const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));

  const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));

  let imgOne = await jimp.read(avatarOne);
  let imgTwo = await jimp.read(avatarTwo);

  // Resize
  imgOne.resize(250, 250);
  imgTwo.resize(250, 250);

  // Composite vertically (magic style)
  pairing_img.composite(imgOne, 300, 80);   // top
  pairing_img.composite(imgTwo, 300, 380);  // bottom

  // Overlay text
  pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_32_WHITE), 200, 20, `💑 ${name1} ❤️ ${name2}`);
  pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_16_WHITE), 180, 650, shayari || "Mohabbat inki taqdeer hai 💖");
  pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_32_WHITE), 180, 700, `✨ Compatibility: ${rating || "100%"} ✨`);

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

  const shayari = shayaris[Math.floor(Math.random() * shayaris.length)] || "Mohabbat inki taqdeer hai 💖";
  const rating = ratings[Math.floor(Math.random() * ratings.length)] || "100%";

  return makeImage({ one: id1, two: id2, name1, name2, shayari, rating }).then(path =>
    api.sendMessage({
      body: `✨ Ye jodi likhi hai bhagwan ne ✨\n━━━━━━━━━━━━━━\n💑 ${name1} ❤️ ${name2}\n${shayari}\n❤️ Compatibility: ${rating}\n━━━━━━━━━━━━━━\n🔱 Powered by Rudra`,
      mentions: [{ id: id1, tag: name1 }, { id: id2, tag: name2 }],
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID)
  );
};
