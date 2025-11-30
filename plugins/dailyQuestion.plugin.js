const fs = require("fs");
const cron = require('node-cron');
const api = require("../core/api/api.js");

const fileName = "./storage/questions-dataset.json";
const channelID = "914557391067054081"; // Main Channel
const dailyPingID = "711962609523621960";
const alertsChannelID = "1079816654269194384"; // Alerts Channel
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

module.exports = () => {
    const { client } = api;

    // Schedule the task
    cron.schedule('00 14 * * *', async () => {
        try {
            const channel = await client.channels.fetch(channelID);
            if (channel) {
                await processDailyQuestion(channel, client);
            } else {
                console.error("Daily Question Error: Channel not found.");
            }
        } catch (error) {
            console.error("Daily Question Error: Could not fetch channel.", error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Madrid"
    });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processDailyQuestion(channel, client) {
    try {
        const fileContent = fs.readFileSync(fileName, "utf8");
        const questions = JSON.parse(fileContent);

        let questionText = "";
        let nextId = questions.current_id;
        let isOutOfStock = false;
        let randomIndex = -1;

        // 1. Determine Content (Real Question vs. Out of Stock Message)
        if (!questions.unread_questions || questions.unread_questions.length === 0) {
            console.warn("Daily Question: List is empty. Sending apology message.");
            // Cursive is done with asterisks in Discord Markdown
            questionText = "*No quedan más preguntas, disculpe las molestias.*"; 
            isOutOfStock = true;
        } else {
            randomIndex = Math.floor(Math.random() * questions.unread_questions.length);
            questionText = questions.unread_questions[randomIndex];
            nextId = questions.current_id + 1; // Only increment ID if we have a real question
        }

        // 2. Construct Payload
        const messagePayload = {
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
                    "title": questionText
                }
            ]
        };

        // 3. Send Message with Retries
        let sentMessage = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                sentMessage = await channel.send(messagePayload);
                console.log(`Daily question sent successfully on attempt ${attempt}`);
                break;
            } catch (err) {
                console.error(`Attempt ${attempt} failed to send daily question:`, err.message);
                if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            }
        }

        // 4. Post-Send Actions (Only if message sent)
        if (sentMessage) {
            
            // Only perform DB updates and Threads if we actually had a question
            if (!isOutOfStock) {
                // -- Create Thread --
                try {
                    const thread = await sentMessage.startThread({
                        name: "Pregunta - " + nextId
                    });
                    if (thread) await thread.leave(); 
                } catch (threadErr) {
                    console.error("Message sent, but failed to create thread:", threadErr);
                }

                // -- Update Database --
                questions.current_id = nextId;
                questions.unread_questions.splice(randomIndex, 1);
                questions.read_questions.push({
                    "id": nextId,
                    "question": questionText
                });

                fs.writeFileSync(fileName, JSON.stringify(questions, null, 2), "utf8");
            }

            // 5. LOW QUESTIONS ALERT
            // Calculate remaining. If out of stock, remaining is 0.
            const remainingCount = isOutOfStock ? 0 : questions.unread_questions.length;
            
            if (remainingCount < 50) {
                try {
                    const alertsChannel = await client.channels.fetch(alertsChannelID);
                    if (alertsChannel) {
                        await alertsChannel.send(`⚠️ **Alerta:** Quedan solo **${remainingCount}** preguntas por leer en el banco de preguntas.`);
                    } else {
                        console.error("Daily Question Alert: Alerts channel not found.");
                    }
                } catch (alertErr) {
                    console.error("Daily Question Alert: Failed to send alert message.", alertErr);
                }
            }

        } else {
            console.error("CRITICAL: Failed to send daily question after multiple attempts. Database not updated.");
        }

    } catch (error) {
        console.error("Daily Question System Error:", error);
    }
}