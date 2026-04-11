const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "quickhack",
  version: "5.0",
  hasPermssion: 0,
  credits: "Rudra x ChatGPT ULTRA MAX",
  description: "Cinematic hacker prank with profile + terminal + stable system",
  commandCategory: "fun",
  usages: "@user",
  cooldowns: 15,
};

const adminUID = "61550558518720";

module.exports.run = async function ({ api, event }) {
  const { senderID, mentions, threadID, messageID } = event;

  if (senderID !== adminUID) {
    return api.sendMessage("❌ ACCESS DENIED", threadID, messageID);
  }

  if (Object.keys(mentions).length === 0) {
    return api.sendMessage("⚠️ TARGET REQUIRED", threadID, messageID);
  }

  const targetUID = Object.keys(mentions)[0];
  const targetName = Object.values(mentions)[0].replace(/@/g, "");

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  let profilePath = null;
  let realName = targetName;
  let picSuccess = false;

  try {

    // 🎬 START
    let msg = await api.sendMessage("🖥️ INITIALIZING SYSTEM...", threadID);

    await wait(1200);
    api.editMessage(`🎯 TARGET LOCKED\n> ${targetName}`, msg.messageID);

    await wait(1500);
    api.editMessage("📡 CONNECTING TO SERVER...", msg.messageID);

    await wait(1500);
    api.editMessage("🔍 SCANNING PROFILE...", msg.messageID);

    // 📸 PROFILE FETCH
    try {
      const userInfo = await api.getUserInfo(targetUID);

      if (userInfo && userInfo[targetUID]) {
        realName = userInfo[targetUID].name || targetName;

        if (userInfo[targetUID].profileUrl) {
          const dir = path.join(__dirname, "cache");
          await fs.ensureDir(dir);

          profilePath = path.join(dir, `${targetUID}.jpg`);

          const res = await axios({
            url: userInfo[targetUID].profileUrl,
            method: "GET",
            responseType: "stream"
          });

          const writer = fs.createWriteStream(profilePath);
          res.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          picSuccess = true;
        }
      }
    } catch (e) {
      console.log("Profile error:", e.message);
    }

    await wait(1500);
    api.editMessage("📂 ACCESSING DATABASE...", msg.messageID);

    // 💻 TERMINAL LOGS
    await wait(1200);
    await api.sendMessage("root@system:~$ bypass_firewall --force", threadID);

    await wait(1000);
    await api.sendMessage("✔ firewall bypassed", threadID);

    await wait(1200);
    await api.sendMessage("root@system:~$ decrypt_user_data", threadID);

    await wait(1500);
    await api.sendMessage("✔ decryption success", threadID);

    // ⚙️ PROGRESS
    const bars = [
      "█░░░░░░░░░ 10%",
      "███░░░░░░░ 30%",
      "█████░░░░░ 50%",
      "███████░░░ 70%",
      "█████████░ 90%",
      "██████████ 100%"
    ];

    for (let bar of bars) {
      await api.sendMessage(`⚙️ EXECUTING...\n${bar}`, threadID);
      await wait(700);
    }

    await api.sendMessage("🧠 AI ANALYZING TARGET...", threadID);
    await wait(1500);

    // 🔒 RESULT
    const resultText = 
`🚨 ACCESS GRANTED 🚨

👤 NAME: ${realName}
🆔 UID: ${targetUID}

📧 EMAIL: ********@gmail.com
🔑 PASSWORD: ***********

🌐 IP: 192.168.*.*
📍 LOCATION: INDIA

📊 STATUS: FULL ACCESS
⚠️ VULNERABILITY FOUND`;

    if (picSuccess && profilePath) {
      await api.sendMessage({
        body: resultText,
        attachment: fs.createReadStream(profilePath)
      }, threadID);
    } else {
      await api.sendMessage(resultText, threadID);
    }

    // 📩 FAKE DM
    try {
      await api.sendMessage(
        "🚨 ALERT: Suspicious login detected\n(Prank 😄)",
        targetUID
      );
    } catch {}

    await wait(2000);

    // 💀 DRAMA
    await api.sendMessage("⚠️ Injecting payload...", threadID);
    await wait(1500);

    await api.sendMessage("💀 SYSTEM OVERRIDE...", threadID);
    await wait(1500);

    // 😂 FINAL REVEAL
    await api.sendMessage(
`😂😂 OYE ${realName} !!!

FULL SYSTEM HACK HO GYA 😆🔥

...Just kidding 🤣

rUdra ji id logiin kro   😎
crack successful 🔐`,
      threadID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ SYSTEM ERROR", threadID, messageID);
  }

  // 🧹 CLEANUP
  if (profilePath && await fs.exists(profilePath)) {
    fs.unlink(profilePath).catch(() => {});
  }

  // ✅ ADMIN MESSAGE
  await api.sendMessage("✅ PRANK COMPLETED SUCCESSFULLY", threadID);
};
