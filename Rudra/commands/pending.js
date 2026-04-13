const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "pending",
    version: "1.0.5",
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    hasPermssion: 2,
    description: "Manage bot's waiting messages",
    commandCategory: "system",
    cooldowns: 5
};

module.exports.languages = {
    "en": {
        "invaildNumber": "%1 is not a valid number",
        "cancelSuccess": "Refused %1 thread!",
        "notiBox": "BoT Connected Successfully!\nUse +help2 for more info :>",
        "approveSuccess": "Approved successfully %1 threads!",
        "cantGetPendingList": "Can't get the pending list!",
        "returnListPending": "»「PENDING」«❮ The whole number of threads to approve is: %1 thread ❯\n\n%2",
        "returnListClean": "「PENDING」There is no thread in the pending list"
    }
}

// Download function
async function downloadVideo(url, filepath) {
    const response = await axios({url, method: "GET", responseType: "stream"});
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

module.exports.handleReply = async function({ api, event, handleReply, getText }) {
    if (String(event.senderID) !== String(handleReply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;

    if ((isNaN(body) && body.indexOf("c") == 0) || body.indexOf("cancel") == 0) {
        const index = (body.slice(1, body.length)).split(/\s+/);
        for (const singleIndex of index) {
            if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > handleReply.pending.length)
                return api.sendMessage(getText("invaildNumber", singleIndex), threadID, messageID);
            api.removeUserFromGroup(api.getCurrentUserID(), handleReply.pending[singleIndex - 1].threadID);
            count+=1;
        }
        return api.sendMessage(getText("cancelSuccess", count), threadID, messageID);
    }
    else {
        const index = body.split(/\s+/);
        for (const singleIndex of index) {
            if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > handleReply.pending.length)
                return api.sendMessage(getText("invaildNumber", singleIndex), threadID, messageID);
            
            // --- New Attachment System ---
            // You might fetch the video link here. For example purposes, use a dummy Imgur link.
            const videoUrl = "https://i.imgur.com/FkKEgiz.mp4"; // Replace with dynamic extraction
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const filePath = path.join(cacheDir, `pending_${Date.now()}.mp4`);

            try {
                await downloadVideo(videoUrl, filePath);
                api.sendMessage({
                    body: getText("notiBox"),
                    attachment: fs.createReadStream(filePath)
                }, handleReply.pending[singleIndex - 1].threadID, (err, info) => {
                    // Schedule file delete
                    setTimeout(() => fs.unlinkSync(filePath), 5 * 60 * 1000);
                });
            } catch (e) {
                api.sendMessage(getText("notiBox"), handleReply.pending[singleIndex - 1].threadID);
            }
            count+=1;
        }
        return api.sendMessage(getText("approveSuccess", count), threadID, messageID);
    }
}

module.exports.run = async function({ api, event, getText }) {
    const { threadID, messageID } = event;
    const commandName = this.config.name;
    let msg = "", index = 1;

    try {
        var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
        var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
    } catch (e) { return api.sendMessage(getText("cantGetPendingList"), threadID, messageID) }

    const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

    for (const single of list) msg += `${index++}/ ${single.name}(${single.threadID})\n`;

    if (list.length != 0) return api.sendMessage(getText("returnListPending", list.length, msg), threadID, (error, info) => {
        global.client.handleReply.push({
            name: commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
        })
    }, messageID);
    else return api.sendMessage(getText("returnListClean"), threadID, messageID);
}
