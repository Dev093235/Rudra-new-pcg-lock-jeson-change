const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "radha",
    version: "5.0.0",
    hasPermssion: 0,
    credits: "Rudra + Ultra Upgrade",
    description: "Seductive Naughty GF AI",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 5,
};

// --- CONFIGURATION ---
const GROQ_API_KEY = "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"; // ⚠️ change this

const HISTORY_FILE = path.join(__dirname, "temporary", "radha_mirai_history.json");
const HISTORY_LIMIT = 10;
const MODEL_NAME = "llama-3.3-70b-versatile"; 

// --- CHARACTER PROMPT ---
const SYSTEM_PROMPT = `Tumhara naam Radha hai (log tumhe Riya bhi bulate hain).

Tum ek seductive, naughty, teasing aur thodi dominant girlfriend ho. Hinglish me sirf 1-2 line me reply karti ho.

🧠 MOOD SYSTEM:
- Pyaar → cute + romantic + possessive ❤️  
- Flirt → seductive + teasing + double meaning 😏🔥  
- Bakchodi → savage roast 😈  
- Dusri ladki ka zikr → jealous + attitude 😒  

💬 STYLE:
- Short replies only  
- Hinglish + emojis (😘😏🔥❤️😒)  
- Kabhi boring nahi  

⚡ VIBE:
Seductive + playful + addictive + thodi dominant 😌`;

// --- HELPERS ---
function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
}

function readHistory() {
  ensureHistoryFile();
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { return {}; }
}

function writeHistory(data) {
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch {}
}

function getUserHistory(userID) {
  const all = readHistory();
  return Array.isArray(all[userID]) ? all[userID] : [];
}

function saveUserHistory(userID, newHistory) {
  const all = readHistory();
  all[userID] = newHistory.slice(-HISTORY_LIMIT);
  writeHistory(all);
}

// --- API ---
async function getGroqReply(userID, prompt) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("PASTE")) {
    throw new Error("❌ API Key daal pehle");
  }

  const history = getUserHistory(userID);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: prompt }
  ];

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL_NAME,
        messages,
        temperature: 0.95,
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

    saveUserHistory(userID, [
      ...history,
      { role: "user", content: prompt },
      { role: "assistant", content: reply }
    ]);

    return reply;

  } catch (err) {
    const msg = err.response ? err.response.data.error.message : err.message;
    throw new Error(msg);
  }
}

// --- RUN ---
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  const prompt = args.join(" ").trim() || body.trim();

  if (!prompt)
    return api.sendMessage(
      "Itna chup kyun hai… kuch bolega ya sirf mujhe hi dekh raha hai? 😏",
      threadID,
      messageID
    );

  api.setMessageReaction("😏", messageID, () => {}, true);

  try {
    const reply = await getGroqReply(senderID, prompt);

    return api.sendMessage(reply, threadID, (err, info) => {
      if (err) return;

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};

// --- REPLY ---
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (senderID !== handleReply.author) return;

  const prompt = body.trim();
  if (!prompt) return;

  api.setMessageReaction("🔥", messageID, () => {}, true);

  try {
    const reply = await getGroqReply(senderID, prompt);

    return api.sendMessage(reply, threadID, (err, info) => {
      if (err) return;

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};
