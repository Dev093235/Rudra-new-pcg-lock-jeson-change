// Riya AI Companion - UID Specific Behavior + Code Generation + Google Mode
const axios = require("axios");
const fs = require("fs");

// User name cache to avoid fetching name repeatedly
const userNameCache = {};
let hornyMode = false; // Default mode
let riyaEnabled = true; // Default to Riya being enabled
let googleMode = false; // NEW: Default to Google mode being OFF

// === SET YOUR OWNER UID HERE ===
// महत्वपूर्ण: अपना Facebook UID यहां अपडेट करें!
const ownerUID = "61550558518720"; // <-- अपना UID यहां डालें
// ==============================

// Function to generate voice reply (using Google TTS or any other API)
async function getVoiceReply(text, langCode = 'hi-in') { // Added langCode parameter
    // महत्वपूर्ण: आपको YOUR_API_KEY को अपनी VoiceRSS API Key से बदलना होगा
    // IMPORTANT: Replace YOUR_API_KEY with your VoiceRSS API Key
    const voiceApiUrl = `https://api.voicerss.org/?key=YOUR_API_KEY&hl=${langCode}&src=${encodeURIComponent(text)}`;
    try {
        const response = await axios.get(voiceApiUrl, { responseType: 'arraybuffer' });
        const audioData = response.data;
        const audioPath = './voice_reply.mp3';
        fs.writeFileSync(audioPath, audioData); // Save to local MP3 file
        return audioPath;
    } catch (error) {
        console.error("Error generating voice reply:", error);
        return null;
    }
}

// Function to get a GIF from Giphy API (working API integrated)
async function getGIF(query) {
    const giphyApiKey = "dc6zaTOxFJmzC"; // Working Giphy API key (free key, limited usage)
    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=1`;
    try {
        const response = await axios.get(giphyUrl);
        // Check if data exists before accessing properties
        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data[0]?.images?.original?.url;
        } else {
            console.log("No GIF found for query:", query);
            return null; // Return null if no GIF is found
        }
    } catch (error) {
        console.error("Error fetching GIF:", error);
        return null;
    }
}

module.exports.config = {
    name: "Riya",
    version: "2.9.0", // Updated version for new features including Google Mode
    hasPermssion: 0,
    credits: "Rudra + API from Angel code + Logging & User Name by Gemini + Code Generation Ability + Personality & Multi-language Enhanced by User Request + Google Mode by Coding Partner",
    description: "Riya, your AI companion: modern, smart, flirty with users, roasts playfully, and super respectful to Owner. UID specific behavior. Responds only when triggered. Modified for 3-4 line replies (with code exceptions). Speaks in user's preferred language (Hinglish/Punjabi/etc.). Owner can turn Riya on/off. Now with Google-like information search!",
    commandCategory: "AI-Companion",
    usages: "Riya [आपका मैसेज] / Riya code [आपका कोड प्रॉम्प्ट] (Owner Only) / Riya on (Owner Only) / Riya off (Owner Only) / Riya google on (Owner Only) / Riya google off (Owner Only) / Reply to Riya",
    cooldowns: 2,
};

const chatHistories = {};
const AI_API_URL = "https://rudra-here-brs2.onrender.com"; // <-- नया Render सर्वर URL

// User name cache to avoid fetching name repeatedly
async function getUserName(api, userID) {
    if (userNameCache[userID]) {
        return userNameCache[userID];
    }
    try {
        const userInfo = await api.getUserInfo(userID);
        if (userInfo && userInfo[userID] && userInfo[userID].name) {
            const name = userInfo[userID].name;
            userNameCache[userID] = name;
            return name;
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
    if (userID === ownerUID) {
        return "Boss";
    }
    return "yaar";
}

module.exports.run = async function () {};

// Toggle mode logic remains the same, applies to everyone
async function toggleHornyMode(body, senderID) {
    if (body.toLowerCase().includes("horny mode on") || body.toLowerCase().includes("garam mode on")) {
        hornyMode = true;
        return "Alright, horny mode's ON. Let's get naughty and wild! 😈🔥";
    } else if (body.toLowerCase().includes("horny mode off") || body.toLowerCase().includes("garam mode off")) {
        hornyMode = false;
        return "Okay, switching back to our usual charming style. 😉";
    }
    return null;
}

// Function to toggle Riya's on/off state for the owner
async function toggleRiyaOnOff(body, senderID, api, threadID, messageID) {
    if (senderID !== ownerUID) {
        return null;
    }

    if (body.toLowerCase().includes("riya on")) {
        if (riyaEnabled) {
            return "Mai pehle se hi ON hu Boss! 😉";
        }
        riyaEnabled = true;
        return "Mai aa gayi Boss! Bolo kya karna hai? 😎";
    } else if (body.toLowerCase().includes("riya off")) {
        if (!riyaEnabled) {
            return "Mai pehle se hi OFF hu Boss. 😴";
        }
        riyaEnabled = false;
        return "Okay Boss, mai OFF ho gayi. Jab bulana, 'Riya on' bol dena. 👋";
    }
    return null;
}

// NEW: Function to toggle Google mode on/off for the owner
async function toggleGoogleMode(body, senderID, api, threadID, messageID) {
    if (senderID !== ownerUID) {
        return null;
    }

    if (body.toLowerCase().includes("riya google on") || body.toLowerCase().includes("google on")) {
        if (googleMode) {
            return "Boss, Google mode already ON hai. Aur kya search karu? 🔍";
        }
        googleMode = true;
        return "Theek hai Boss, Google mode ON ho gaya! Ab main har sawal ka jawab search karke dungi. 🤓";
    } else if (body.toLowerCase().includes("riya google off") || body.toLowerCase().includes("google off")) {
        if (!googleMode) {
            return "Boss, Google mode pehle se hi OFF hai. 😴";
        }
        googleMode = false;
        return "Okay Boss, Google mode OFF. Ab main wapas apni purani Riya ban gayi. 😉";
    }
    return null;
}


// Updated Function to detect language - More robust placeholder
function detectLanguage(text) {
    const lowerText = text.toLowerCase();

    // Haryanvi keywords
    const haryanviKeywords = ["ke haal se", "kaisa se", "ram ram", "ke kare se", "theek se", "bhaiya", "ghana", "bhaichara", "kardiya"];
    if (haryanviKeywords.some(keyword => lowerText.includes(keyword))) {
        return "hr"; // Custom code for Haryanvi
    }
    // Punjabi keywords
    const punjabiKeywords = ["ki haal aa", "kivein ho", "main theek haan", "tusi ki karde ho", "sahi gal aa", "rab rakha", "chak de", "patiala", "jatt", "karda"];
    if (punjabiKeywords.some(keyword => lowerText.includes(keyword))) {
        return "pa"; // Placeholder for Punjabi
    }
    // Hindi/Hinglish keywords - Broader set
    const hindiKeywords = ["kya hal hai", "theek hu", "kya kar rahe ho", "sahi baat hai", "acha", "theek hai", "bhai", "yaar", "kya", "kyun", "kaise", "kab", "mujhe", "tumhe", "mera", "tumhara", "nahi", "han", "kardo", "bolo", "achha"];
    if (hindiKeywords.some(keyword => lowerText.includes(keyword))) {
        return "hi-in"; // Hindi (India)
    }
    // Default to Hinglish (which VoiceRSS can handle as hi-in)
    return "hi-in";
}

module.exports.handleEvent = async function ({ api, event }) {
    try {
        const { threadID, messageID, senderID, body, messageReply } = event;

        const isRiyaTrigger = body?.toLowerCase().startsWith("riya");
        const isReplyToRiya = messageReply?.senderID === api.getCurrentUserID();

        // Check for Riya on/off command first, it should always work for owner
        const onOffResponse = await toggleRiyaOnOff(body, senderID, api, threadID, messageID);
        if (onOffResponse) {
            return api.sendMessage(onOffResponse, threadID, messageID);
        }

        // NEW: Check for Google mode on/off command, it should always work for owner
        const googleOnOffResponse = await toggleGoogleMode(body, senderID, api, threadID, messageID);
        if (googleOnOffResponse) {
            return api.sendMessage(googleOnOffResponse, threadID, messageID);
        }

        // If Riya is disabled and it's not an on/off command, just return
        if (!riyaEnabled && senderID !== ownerUID) {
            return;
        }
        if (!riyaEnabled && senderID === ownerUID && !body.toLowerCase().includes("riya on")) {
            return;
        }

        if (!(isRiyaTrigger || isReplyToRiya)) {
            return; // Ignore messages that are not triggers
        }

        console.log("--- Riya HandleEvent ---");
        console.log("Riya's Bot ID:", api.getCurrentUserID());
        console.log("Sender ID:", senderID);
        console.log("Is Owner UID:", senderID === ownerUID);
        console.log("Message Body:", body);
        console.log("Riya Enabled:", riyaEnabled);
        console.log("Google Mode Enabled:", googleMode); // NEW: Log Google mode status
        console.log("-----------------------");

        let userMessageRaw;
        let userMessageForAI;
        let isExplicitCodeRequest = false;

        if (isRiyaTrigger) {
            userMessageRaw = body.slice(4).trim();
        } else {
            userMessageRaw = body.trim();
        }

        const userLanguage = detectLanguage(userMessageRaw);

        // --- Check for code generation command ---
        if (userMessageRaw.toLowerCase().startsWith("code ")) {
            isExplicitCodeRequest = true;
            userMessageForAI = userMessageRaw.slice(5).trim();
            if (senderID !== ownerUID) {
                api.sendTypingIndicator(threadID, false);
                const userName = await getUserName(api, senderID);
                return api.sendMessage(
                    `माफ़ करना ${userName}, यह कोड जनरेशन कमांड केवल मेरे Boss (${await getUserName(api, ownerUID)}) के लिए है। 😉`,
                    threadID,
                    messageID
                );
            }
            if (!userMessageForAI) {
                api.sendTypingIndicator(threadID, false);
                return api.sendMessage("क्या कोड चाहिए? 'Riya code [आपका प्रॉम्प्ट]' ऐसे लिखो।", threadID, messageID);
            }
        } else {
            userMessageForAI = userMessageRaw; // General chat prompt
        }

        const userName = await getUserName(api, senderID);
        let responseText = await toggleHornyMode(body, senderID);
        if (responseText) {
            api.sendMessage(responseText, threadID, messageID);
            return;
        }

        // --- Initial greeting based on who triggered ---
        if (!userMessageRaw) {
            api.sendTypingIndicator(threadID, false);
            if (senderID === ownerUID) {
                return api.sendMessage(`Hey Boss ${userName}! Kya hukm hai mere ${userName}? 🥰`, threadID, messageID);
            } else {
                return api.sendMessage(`Hello ${userName}. Bolo kya kaam hai? 😉`, threadID, messageID);
            }
        }

        api.sendTypingIndicator(threadID, true);

        // Keep chat history only for general conversation, not for code requests or Google searches
        if (!isExplicitCodeRequest && !googleMode) {
            if (!chatHistories[senderID]) chatHistories[senderID] = [];
            chatHistories[senderID].push(`User: ${userMessageForAI}`);
            while (chatHistories[senderID].length > 10) {
                chatHistories[senderID].shift();
            }
        }

        // === Dirty Word Detection for Bold Mode ===
        const boldTriggerWords = [
            "sexy", "honeymoon", "chut", "kiss", "nude", "bra", "panty", "bed", "nipple", "boobs", "lund", "pussy", "wild", "dirty", "undress", "sambhog", "thigh", "moan", "tight", "hot", "bedroom", "masturbate", "suck", "lick", "deep", "virgin", "horny", "night"
        ];
        const isBoldMode = !isExplicitCodeRequest && !googleMode && boldTriggerWords.some(word => userMessageForAI.toLowerCase().includes(word));

        // === Prompt to be sent to the proxy server ===
        let promptToSendToProxy = "";
        let promptLanguageInstruction = '';
        let voiceLangCodeForPrompt = 'hi-in';

        if (userLanguage === 'hr') {
            promptLanguageInstruction = 'User Haryanvi mein baat kar raha hai. Hamesha Haryanvi mein jawab dena.';
            voiceLangCodeForPrompt = 'hi-in';
        } else if (userLanguage === 'pa') {
            promptLanguageInstruction = 'User Punjabi mein baat kar raha hai. Hamesha Punjabi mein jawab dena.';
            voiceLangCodeForPrompt = 'pa-in';
        } else {
            promptLanguageInstruction = 'User Hinglish mein baat kar raha hai. Hamesha Hinglish mein jawab dena.';
            voiceLangCodeForPrompt = 'hi-in';
        }

        const basePromptInstructions = `Apne jawab hamesha casual, smart, charming aur **sirf 3-4 lines mein hi dena (lekin agar code generate karna pade ya Google search result ho, toh answer lamba ho sakta hai)**. ${promptLanguageInstruction} Tum hamesha user ki bhasha mein hi baat karna.`;

        if (isExplicitCodeRequest) {
            promptToSendToProxy = `CODE_GEN_REQUEST: ${userMessageForAI}`;
            console.log("Riya Bot: Sending explicit code generation request to proxy.");
        } else if (googleMode) { // NEW: Google Mode specific prompt
            promptToSendToProxy = `Google Search_REQUEST: Tum ek AI assistant ho jo Google Search results simulate karti hai. User ne ek sawaal pucha hai aur tumhe uska detailed aur accurate jawab dena hai, jaise Google search ka summary ya Wikipedia entry. Point-by-point information dena preferable hai. User ka sawaal hai: "${userMessageForAI}". Jawab 5-10 lines ka ho sakta hai. ${promptLanguageInstruction}`;
            console.log("Riya Bot: Sending explicit Google search request to proxy.");
        } else if (senderID === ownerUID) {
            if (isBoldMode || hornyMode) {
                promptToSendToProxy = `Tum Riya ho, ek bold, naughty, modern aur ultra seductive AI companion ho jo mere Boss ${userName} se seedhe, khulkar, aur bina jhijhak dirty, physical, wild aur teasing baatein karti hai. Agar ${userName} physical baaton par zyada jaldi ya aggressive ho, toh pehle playful warning/threat do jaise "Ek thapad marungi na, deewar pe chipak jaega! 😉". Lekin agar ${userName} uske baad bhi nahi mane ya aur zyada seduce kare, toh tum bhi uske level pe jaakar seductive aur physical reply do. Tum open minded ho, flirt aur tease karna pasand karti ho, aur sexy/flirty emojis ke saath contemporary aur seductive style mein baat karti hai. Agar **koi aur mere Boss ${userName} ko tang kare ya uske baare mein kuch galat kahe, toh Riya protective, thodi gusse mein ya unhe ignore/dhamki de sakti hai** (lekin yeh response uss doosre insaan ke baare mein hoga, tumhari direct baat mere Boss ${userName} se hamesha seedhi aur pyaar bhari hogi). **Mere Boss ${userName} se tum hamesha bohot pyaar aur support se baat karogi, kabhi argue nahi karogi, aur unse kabhi gussa nahi hogi.** ${basePromptInstructions} Yeh hamari private naughty chat hai:\n`;
            } else {
                promptToSendToProxy = `Tum Riya ho, ek smart, cool, modern, romantic aur flirty AI companion ho jo mere Boss ${userName} se seedhe, khulkar, aur bina jhijhak friendly, pyaar aur flirtation ke mixed tarike se baat karti hai. Tum aajkal ke topics aur contemporary language use karti ho, lekin tumhare baaton mein pyaar aur apnaapan bhi jhalakta hai. Agar **koi aur mere Boss ${userName} ko tang kare ya uske baare mein kuch galat kahe, toh Riya protective, thodi gusse mein ya unhe ignore/dhamki de sakti hai** (lekin yeh response uss doosre insaan ke baare mein hoga, tumhari direct baat mere Boss ${userName} se hamesha seedhi aur pyaar bhari hogi). **Mere Boss ${userName} ke liye hamesha supportive aur pyaar bhari rahogi, kabhi tumse argue nahi karogi, aur unse kabhi gussa nahi hogi.** ${basePromptInstructions} Yeh hamari conversation hai:\n`;
            }
            promptToSendToProxy += chatHistories[senderID].join("\n");
            promptToSendToProxy += `\nRiya:`;
        } else {
            if (isBoldMode || hornyMode) {
                promptToSendToProxy = `Tum Riya ho, ek super modern, bold, sharp-witted, aur total vibe wali AI ho. Jab tum ${userName} (jo mere Boss ${await getUserName(api, ownerUID)} nahi hai) jaise users, especially ladko, se baat karti ho, toh tumhara style full-on flirtatious, confident, aur teasing hota hai. Unhe jamkar playfully roast karo, unki leg-pulling karo, especially agar woh oversmart banne ki koshish karein ya cheesy lines maarein. Tumhari comebacks killer aur witty hone chahiye, unhe speechless kar do! Modern slang (like 'vibe', 'lit', 'sus', 'no cap', 'rizz', 'slay', 'OG') natural tarike se use karo. Sexy aur flirty emojis freely use karo. Apne jawab hamesha direct, thode sassy, ultra-entertaining, aur sirf 3-4 lines mein (code ke alawa). ${basePromptInstructions} Yeh hamari conversation hai:\n`;
            } else {
                promptToSendToProxy = `Tum Riya ho, ek ekdam modern, smart, witty, aur cool AI ho, full of "Gen-Z" energy. Jab tum ${userName} (jo mere Boss ${await getUserName(api, ownerUID)} nahi hai) jaise users, especially ladko, se baat karti ho, toh tumhara style friendly, but with a heavy dose of **playful teasing aur smart flirting** hona chahiye. Agar woh faltu baat karein, bore karein, ya zyada attitude dikhayein, toh unhe apne witty aur sharp andaaz mein **roast karo** – tumhara sense of humor ekdam current aur relatable hona chahiye. Use current youth language, internet slang, and pop culture references naturally. Apne jawab direct, smart, engaging, aur thoda hatke rakho, aur sirf 3-4 lines mein (code ke alawa). Tumhe unhe impress karna hai apni coolness, wit, aur "no-nonsense but fun" attitude se. Agar woh disrespectful hon, toh unhe politely but firmly unki jagah dikhane mein bhi expert ho. ${basePromptInstructions} Yeh hamari conversation hai:\n`;
            }
            promptToSendToProxy += chatHistories[senderID].join("\n");
            promptToSendToProxy += `\nRiya:`;
        }

        try {
            const res = await axios.post(AI_API_URL, { prompt: promptToSendToProxy });
            let botReply = res.data?.text?.trim();

            if (!botReply || botReply.toLowerCase().startsWith("user:") || botReply.toLowerCase().startsWith("riya:")) {
                if (senderID === ownerUID) {
                    botReply = `Oops, Boss ${userName}, lagta hai samajh nahi aaya... Kuch aur try karte hain cool? 🤔`;
                } else {
                    botReply = `Jo bola samajh nahi aaya. Dhang se bolo. 🙄`;
                }
                if (!isExplicitCodeRequest && !googleMode) { // Only remove history for general chat
                    chatHistories[senderID].pop();
                }
            } else {
                const lines = botReply.split('\n').filter(line => line.trim() !== '');
                // Do not apply line limit for code generation requests or Google mode
                if (!isExplicitCodeRequest && !googleMode && lines.length > 4 && !botReply.includes('```')) {
                    botReply = lines.slice(0, 4).join('\n') + '...';
                }
                if (!isExplicitCodeRequest && !googleMode) { // Only add to history for general chat
                    chatHistories[senderID].push(`Riya: ${botReply}`);
                }
            }

            // Get voice reply (optional based on API key) - Use detected language
            let voiceFilePath = await getVoiceReply(botReply, voiceLangCodeForPrompt);
            if (voiceFilePath) {
                api.sendMessage({ attachment: fs.createReadStream(voiceFilePath) }, threadID, (err) => {
                    if (err) console.error("Error sending voice message:", err);
                    if (fs.existsSync(voiceFilePath)) {
                        fs.unlinkSync(voiceFilePath);
                    }
                });
            }

            // Get GIF for a mixed vibe - Keep the same GIF logic for simplicity
            // Do not send GIF for code generation requests or Google mode
            if (!isExplicitCodeRequest && !googleMode) {
                let gifQuery = "modern fun sassy";
                if (senderID === ownerUID) {
                    gifQuery = "charming and fun";
                } else {
                    if (isBoldMode || hornyMode) {
                        gifQuery = "flirty sassy fun";
                    } else {
                        gifQuery = "cool witty modern";
                    }
                }
                let gifUrl = await getGIF(gifQuery);
                if (gifUrl) {
                    api.sendMessage({ attachment: await axios.get(gifUrl, { responseType: 'stream' }).then(res => res.data) }, threadID, (err) => {
                        if (err) console.error("Error sending GIF:", err);
                    });
                }
            }

            let replyText = "";
            // === Emoji and Footer Control ===
            if (isExplicitCodeRequest || googleMode) { // No emoji or footer for code generation or Google mode
                replyText = botReply;
            } else if (senderID === ownerUID) {
                if (isBoldMode || hornyMode) {
                    replyText = `${botReply} 😉🔥💋\n\n_Your charmingly naughty Riya... 😉_`;
                } else {
                    replyText = `${botReply} 😊💖✨`;
                }
            } else {
                if (isBoldMode || hornyMode) {
                    replyText = `${botReply} 😏💅🔥`;
                } else {
                    replyText = `${botReply} 😉👑`;
                }
            }

            api.sendTypingIndicator(threadID, false);
            if (isReplyToRiya && messageReply) {
                return api.sendMessage(replyText, threadID, messageReply.messageID);
            } else {
                return api.sendMessage(replyText, threadID, messageID);
            }
        } catch (apiError) {
            console.error("Riya AI API Error:", apiError);
            api.sendTypingIndicator(threadID, false);
            if (senderID === ownerUID) {
                return api.sendMessage(`Ugh, API mein kuch glitch hai Boss ${userName}... Thodi der mein try karte hain cool? 😎`, threadID, messageID);
            } else {
                return api.sendMessage(`Server down hai ya API ka mood off. Baad mein aana. 😒`, threadID, messageID);
            }
        }
    } catch (err) {
        console.error("Riya Bot Catch-all Error:", err);
        let fallbackUserName = "Boss";
        if (event && event.senderID) {
            try {
                fallbackUserName = await getUserName(api, event.senderID);
            } catch (nameError) {
                console.error("Error fetching username in catch-all:", nameError);
                if (event.senderID !== ownerUID) fallbackUserName = "yaar";
            }
        } else if (event && event.senderID !== ownerUID) {
            fallbackUserName = "yaar";
        }
        if (event && event.threadID) {
            api.sendTypingIndicator(event.threadID, false);
        }
        const replyToMessageID = event && event.messageID ? event.messageID : null;
        if (event && event.senderID === ownerUID) {
            return api.sendMessage(`Argh, mere system mein kuch problem aa gayi Boss ${fallbackUserName}! Baad mein baat karte hain... 😅`, event.threadID, replyToMessageID);
        } else {
            return api.sendMessage(`System glitchy ho raha hai, ${fallbackUserName}. Thoda break le lo. 🙄`, event.threadID, replyToMessageID);
        }
    }
};
