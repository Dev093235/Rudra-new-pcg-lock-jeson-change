module.exports.config = {
    name: "pair1",
    version: "2.0.1",
    hasPermssion: 0,
    credits: "Priyansh Rajput (Remix by Copilot)",
    description: "Unique love pairing command",
    commandCategory: "love",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "jimp": ""
    }
};

module.exports.onLoad = async () => {
    const { resolve } = global.nodemodule["path"];
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { downloadFile } = global.utils;
    const dirMaterial = __dirname + `/cache/canvas/`;
    const path = resolve(__dirname, 'cache/canvas', 'pairing.jpg');
    if (!existsSync(dirMaterial + "canvas")) mkdirSync(dirMaterial, { recursive: true });
    if (!existsSync(path)) await downloadFile("https://i.postimg.cc/65x1Q2Wx/image-1771265751438.jpg", path);
};

async function makeImage({ one, two }) {
    const fs = global.nodemodule["fs-extra"];
    const path = global.nodemodule["path"];
    const axios = global.nodemodule["axios"];
    const jimp = global.nodemodule["jimp"];
    const __root = path.resolve(__dirname, "cache", "canvas");

    let pairing_img = await jimp.read(__root + "/pairing.jpg");
    let pathImg = __root + `/pairing_${one}_${two}.png`;
    let avatarOne = __root + `/avt_${one}.png`;
    let avatarTwo = __root + `/avt_${two}.png`;

    let getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));

    let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));

    let circleOne = await jimp.read(await circle(avatarOne));
    let circleTwo = await jimp.read(await circle(avatarTwo));

    // ✨ Positioning avatars
    pairing_img.composite(circleOne.resize(100, 100), 350, 100)
               .composite(circleTwo.resize(100, 100), 250, 200);

    // ✨ Add overlay text
    pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_32_WHITE), 200, 20, "💑 Perfect Match 💑");
    pairing_img.print(await jimp.loadFont(jimp.FONT_SANS_16_WHITE), 200, 300, "✨ Destiny decided this pair ✨");

    let raw = await pairing_img.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, raw);
    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);

    return pathImg;
}

async function circle(image) {
    const jimp = require("jimp");
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}

module.exports.run = async function ({ api, event }) {
    const fs = require("fs-extra");
    const { threadID, messageID, senderID } = event;

    // Random compatibility %
    const tl = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', "48%"];
    const tle = tl[Math.floor(Math.random() * tl.length)];

    let dataa = await api.getUserInfo(senderID);
    let namee = dataa[senderID].name;

    let loz = await api.getThreadInfo(threadID);
    let emoji = loz.participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());
    let id = emoji[Math.floor(Math.random() * emoji.length)];

    let data = await api.getUserInfo(id);
    let name = data[id].name;

    let arraytag = [
        { id: senderID, tag: namee },
        { id: id, tag: name }
    ];

    let one = senderID, two = id;

    // Clean romantic shayaris only
    const shayaris = [
        "💫 Mohabbat inki taqdeer ban chuki hai 💖",
        "💘 In dono ki jodi pe rab bhi fakr kare 🙏",
        "🌟 Ishq bhi sharma jaaye inke aage 😍",
        "👑 Dil se dil ka milna yeh toh asmaanon ka rishta hai 🕊️",
        "🔥 Ruh ka milan hai yeh, sirf jism ka nahi 💑",
        "🌸 Inka rishta toh janmon ka hai 💍",
        "✨ Dil se dil ka rishta hai, jo kabhi nahi toote ✨",
        "❤️ Rab ne likhi hai inki prem kahani ❤️",
        "🌹 Inka pyaar khud ek misaal hai 🌹",
        "💞 Ye jodi hamesha khush rahe 💞"
    ];
    const shayari = shayaris[Math.floor(Math.random() * shayaris.length)];

    return makeImage({ one, two }).then(path =>
        api.sendMessage({
            body: `✨ Unique Pairing ✨\n━━━━━━━━━━━━━━\n💑 ${namee} ❤️ ${name}\n${shayari}\nCompatibility odds: ${tle}\n🌸 Destiny has spoken 🌸`,
            mentions: arraytag,
            attachment: fs.createReadStream(path)
        }, threadID, () => fs.unlinkSync(path), messageID)
    );
};
