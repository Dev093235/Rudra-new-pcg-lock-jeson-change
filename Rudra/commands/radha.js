const axios = require("axios");
const fs = require("fs");
const path = require("path");
const edgeTTS = require("edge-tts");

module.exports.config = {
    name: "radha",
    version: "ABSOLUTE-FINAL-REAL-VOICE",
    hasPermssion: 0,
    credits: "Rudra + Final Upgrade",
    description: "Radha AI Perfect System",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 3,
};

const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

const BASE_DIR = path.join(__dirname, "temporary");
const HISTORY_FILE = path.join(BASE_DIR, "history.json");
const USER_FILE = path.join(BASE_DIR, "users.json");

const SYSTEM_PROMPT = `Tum Radha ho — flirty, naughty, teasing GF style Hinglish 😏🔥
Short reply dena.`;

// ---------- SETUP ----------
function ensureFiles() {
  if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, "{}");
  if (!fs.existsSync(USER_FILE)) fs.writeFileSync(USER_FILE, "{}");
}

// ---------- USER ----------
function getUser(id) {
  ensureFiles();
  return JSON.parse(fs.readFileSync(USER_FILE))[id] || {};
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
  return JSON.parse(fs.readFileSync(HISTORY_FILE))[id] || [];
}

function saveHistory(id, history) {
  const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  data[id] = history.slice(-10);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// ---------- CLEAN ----------
function cleanText(text) {
  return text
    .replace(/radha/gi, "")
    .replace(/voice on/gi, "")
    .replace(/voice off/gi, "")
    .trim();
}

// ---------- REMOVE EMOJI ----------
function removeEmoji(text) {
  return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

// ---------- VOICE (REAL HUMAN) ----------
async function textToVoice(text, filePath) {
  await edgeTTS.save({
    text: text,
    voice: "hi-IN-SwaraNeural", // 🔥 best female Hindi
    file: filePath
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
    { role: "system", content: SYSTEM_PROMPT },
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

  if (senderID == api.getCurrentUserID()) return;

  let prompt = args.join(" ").trim() || body.trim();
  prompt = cleanText(prompt);

  const user = getUser(senderID);

  const msg = body.toLowerCase().trim();

  if (msg === "voice on") {
    setUser(senderID, { voice: true });
    return api.sendMessage("Voice ON 😏🎤", threadID, messageID);
  }

  if (msg === "voice off") {
    setUser(senderID, { voice: false });
    return api.sendMessage("Voice OFF 😌", threadID, messageID);
  }

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
    const file = path.join(BASE_DIR, `${Date.now()}.mp3`);
    let text = removeEmoji(reply);

    await textToVoice(text, file);

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

  if (senderID == api.getCurrentUserID()) return;
  if (senderID !== handleReply.author) return;

  if (handleReply.askGender) {
    const text = body.toLowerCase();

    if (text.includes("ladka")) setUser(senderID, { gender: "male" });
    else if (text.includes("ladki")) setUser(senderID, { gender: "female" });
    else return api.sendMessage("Seedha bol — ladka ya ladki 😒", threadID, messageID);

    return api.sendMessage("Samajh gayi 😏 ab baat kar", threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  }

  const user = getUser(senderID);
  let clean = cleanText(body);

  const reply = await getReply(senderID, clean);

  if (user.voice) {
    const file = path.join(BASE_DIR, `${Date.now()}.mp3`);
    let text = removeEmoji(reply);

    await textToVoice(text, file);

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
