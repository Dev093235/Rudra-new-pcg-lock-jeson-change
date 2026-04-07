const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const googleTTS = require("google-tts-api");

module.exports.config = {
    name: "radha",
    version: "18.0.0",
    hasPermssion: 0,
    credits: "Rudra Ultra Fix",
    description: "GF/BF AI FINAL ULTRA",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 3,
};

const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

const BASE_DIR = path.join(__dirname, "temporary");
const HISTORY_FILE = path.join(BASE_DIR, "history.json");
const USER_FILE = path.join(BASE_DIR, "users.json");

// ---------- SETUP ----------
function ensureFiles() {
  if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, "{}");
  if (!fs.existsSync(USER_FILE)) fs.writeFileSync(USER_FILE, "{}");
}

// ---------- USER ----------
function getUser(id) {
  ensureFiles();
  const data = JSON.parse(fs.readFileSync(USER_FILE));
  return data[id] || {};
}

function setUser(id, update) {
  ensureFiles();
  const data = JSON.parse(fs.readFileSync(USER_FILE));
  data[id] = { ...(data[id] || {}), ...update };
  fs.writeFileSync(USER_FILE, JSON.stringify(data, null, 2));
}

// ---------- HISTORY ----------
function getHistory(id) {
  ensureFiles();
  const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  return data[id] || [];
}

function saveHistory(id, history) {
  ensureFiles();
  const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  data[id] = history.slice(-10);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// ---------- VOICE ----------
async function textToVoice(text, filePath) {
  return new Promise((resolve, reject) => {
    const url = googleTTS.getAudioUrl(text, {
      lang: "en",
      slow: false
    });

    const file = fs.createWriteStream(filePath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", reject);
  });
}

// ---------- AI ----------
async function getReply(userID, prompt) {
  const user = getUser(userID);
  const history = getHistory(userID);

  let dynamic = "";
  if (user.gender === "male") dynamic = "User ladka hai → tum ladki GF ban jao.";
  if (user.gender === "female") dynamic = "User ladki hai → tum ladka BF ban jao.";

  const messages = [
    { role: "system", content: "Tum Radha ho, flirty, bold, teasing Hinglish GF/BF 😏🔥" },
    { role: "system", content: dynamic },
    ...history,
    { role: "user", content: prompt }
  ];

  const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
    model: MODEL_NAME,
    messages,
    temperature: 1,
    max_tokens: 150
  }, {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const reply = res.data.choices[0].message.content;

  saveHistory(userID, [
    ...history,
    { role: "user", content: prompt },
    { role: "assistant", content: reply }
  ]);

  return reply;
}

// ---------- MAIN ----------
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  const prompt = args.join(" ").trim() || body.trim();
  const user = getUser(senderID);

  // Voice toggle
  if (prompt.toLowerCase() === "voice on") {
    setUser(senderID, { voice: true });
    return api.sendMessage("Voice ON 😏🎤", threadID, messageID);
  }

  if (prompt.toLowerCase() === "voice off") {
    setUser(senderID, { voice: false });
    return api.sendMessage("Voice OFF 😌", threadID, messageID);
  }

  // Ask gender
  if (!user.gender) {
    return api.sendMessage("Tum ladka ho ya ladki? 😏", threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        askGender: true
      });
    }, messageID);
  }

  const reply = await getReply(senderID, prompt);

  if (user.voice) {
    const file = path.join(BASE_DIR, "voice.mp3");
    await textToVoice(reply, file);

    return api.sendMessage({
      body: reply,
      attachment: fs.createReadStream(file)
    }, threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  }

  return api.sendMessage(reply, threadID, (err, info) => {
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

// ---------- HANDLE ----------
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (senderID !== handleReply.author) return;

  // Gender save
  if (handleReply.askGender) {
    const text = body.toLowerCase();

    if (text.includes("ladka") || text.includes("boy")) {
      setUser(senderID, { gender: "male" });
    } else if (text.includes("ladki") || text.includes("girl")) {
      setUser(senderID, { gender: "female" });
    } else {
      return api.sendMessage("Seedha bol — ladka ya ladki 😒", threadID, messageID);
    }

    return api.sendMessage("Samajh gayi 😏 ab baat kar", threadID, messageID);
  }

  const user = getUser(senderID);
  const reply = await getReply(senderID, body);

  if (user.voice) {
    const file = path.join(BASE_DIR, "voice.mp3");
    await textToVoice(reply, file);

    return api.sendMessage({
      body: reply,
      attachment: fs.createReadStream(file)
    }, threadID, messageID);
  }

  return api.sendMessage(reply, threadID, messageID);
};
