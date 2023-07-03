const fs = require("fs");
const cron = require('node-cron');
const api = require("../core/api/api.js")

const fileName = "./storage/questions-dataset.json"
const channelID = "914557391067054081"
const dailyPingID = "711962609523621960"

module.exports = () => {
    const { client } = api

    const channel = client.channels.cache.get(channelID);
    sendRandomDailyQuestion(channel);

    cron.schedule('0 14 * * *', () => {
        sendRandomDailyQuestion(channel);
    }, {
        scheduled: true,
        timezone: "Europe/Madrid"
    });
}

function sendRandomDailyQuestion(channel) {
    const questions = JSON.parse(fs.readFileSync(fileName, "utf8"));

    const randomIndex = Math.floor(Math.random() * questions.unread_questions.length);
    const randomQuestion = questions.unread_questions[randomIndex];

    channel.send({
        "content": `<@&${dailyPingID}>`,
        "embeds": [
            {
                "color": 39129,
                "timestamp": new Date().toISOString(),
                "author": {
                    "icon_url": "https://cdn-icons-png.flaticon.com/512/5893/5893002.png",
                    "name": "Pregunta Diaria"
                },
                "footer": {
                    "text": "Preguntas de la Comunidad"
                },
                "title": randomQuestion
            }
        ]
    });

    questions.unread_questions.splice(randomIndex, 1);
    questions.read_questions.push(randomQuestion);
    const jsonString = JSON.stringify(questions, null, 2);

    fs.writeFileSync(fileName, jsonString, "utf8");
}
