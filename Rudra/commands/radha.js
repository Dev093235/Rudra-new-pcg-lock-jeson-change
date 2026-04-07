const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const googleTTS = require("google-tts-api");

module.exports.config = {
    name: "radha",
    version: "17.0.0",
    hasPermssion: 0,
    credits: "Rudra Fixed Final",
    description: "GF/BF AI + Voice + Ask System",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 3,
};

// --- CONFIG ---
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

const BASE_DIR = path.join(__dirname, "temporary");
const HISTORY_FILE = path.join(BASE_DIR, "history.json");
const USER_FILE = path.join(BASE_DIR, "users.json");

// --- AUTO SETUP ---
function ensureFiles() {
  if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}));
  if (!fs.existsSync(USER_FILE)) fs.writeFileSync(USER_FILE, JSON.stringify({}));
}

// --- USER ---
function getUsers() {
  ensureFiles();
  return JSON.parse(fs.readFileSync(USER_FILE));
}

function saveUsers(data) {
  fs.writeFileSync(USER_FILE, JSON.stringify(data, null, 2));
}

function getUser(id) {
  const data = getUsers();
  return data[id] || {};
}

function setUser(id, update) {
  const data = getUsers();
  data[id] = { ...(data[id] || {}), ...update };
  saveUsers(data);
}

// --- HISTORY ---
function getHistory(id) {
  ensureFiles();
  const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  return data[id] || [];
}

function saveHistory(id, history) {
  const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  data[id] = history.slice(-10);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// --- VOICE (FIXED) ---
async function textToVoice(text, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const url = googleTTS.getAudioUrl(text, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
      });

      const file = fs.createWriteStream(filePath);
      https.get(url, (res) => {
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }).on("error", reject);

    } catch (e) {
      reject(e);
    }
  });
}

// --- AI ---
async function getReply(userID, prompt) {
  if (!GROQ_API_KEY.includes("gsk_")) throw new Error("API key daal");

  const user = getUser(userID);
  const history = getHistory(userID);

  let dynamic = "";

  if (user.gender === "male") {
    dynamic = "User ladka hai → tum ladki (girlfriend) ban kar baat karo.";
  } else if (user.gender === "female") {
    dynamic = "User ladki hai → tum ladka (boyfriend) ban kar baat karo.";
  }

  const messages = [
    {
      role: "system",
      content: "Tum Radha ho — bold, teasing, seductive aur playful. Hinglish me short reply do 😏🔥"
    },
    { role: "system", content: dynamic },
    ...history,
    { role: "user", content: prompt }
  ];

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: MODEL_NAME,
      messages,
      temperature: 1,
      max_tokens: 150
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const reply = res.data.choices[0].message.content;

  saveHistory(userID, [
    ...history,
    { role: "user", content: prompt },
    { role: "assistant", content: reply }
  ]);

  return reply;
}

// --- RUN ---
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  const prompt = args.join(" ").trim() || body.trim();
  const user = getUser(senderID);

  if (prompt.toLowerCase() === "voice on") {
    setUser(senderID, { voice: true });
    return api.sendMessage("Ab main bolungi bhi 😏🎤", threadID, messageID);
  }

  if (prompt.toLowerCase() === "voice off") {
    setUser(senderID, { voice: false });
    return api.sendMessage("Theek hai… sirf text 😌", threadID, messageID);
  }

  if (!user.gender) {
    return api.sendMessage(
      "Tum ladka ho ya ladki? 😏",
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          askGender: true
        });
      },
      messageID
    );
  }

  try {
    const reply = await getReply(senderID, prompt);

    if (user.voice) {
      const file = path.join(BASE_DIR, "voice.mp3");
      await textToVoice(reply, file);

      return api.sendMessage({
        body: reply,
        attachment: fs.createReadStream(file)
      }, threadID, messageID);
    } else {
      return api.sendMessage(reply, threadID, messageID);
    }

  } catch (e) {
    api.sendMessage("Error: " + e.message, threadID, messageID);
  }
};

// --- HANDLE REPLY ---
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (senderID !== handleReply.author) return;

  if (handleReply.askGender) {
    const text = body.toLowerCase();

    if (text.includes("ladka") || text.includes("boy")) {
      setUser(senderID, { gender: "male" });
    } else if (text.includes("ladki") || text.includes("girl")) {
      setUser(senderID, { gender: "female" });
    } else {
      return api.sendMessage("Seedha batao — ladka ya ladki 😒", threadID, messageID);
    }

    return api.sendMessage("Samajh gayi 😏 ab baat karo", threadID, messageID);
  }

  try {
    const user = getUser(senderID);
    const reply = await getReply(senderID, body);

    if (user.voice) {
      const file = path.join(BASE_DIR, "voice.mp3");
      await textToVoice(reply, file);

      return api.sendMessage({
        body: reply,
        attachment: fs.createReadStream(file)
      }, threadID, messageID);
    } else {
      return api.sendMessage(reply, threadID, messageID);
    }

  } catch (e) {
    api.sendMessage("Error: " + e.message, threadID, messageID);
  }
};
