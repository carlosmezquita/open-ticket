const fs = require("fs");
const cron = require('node-cron');
const api = require("../core/api/api.js");
const { StringSelectMenuOptionBuilder, Events, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");

const fileName = "./storage/questions-dataset.json"
const channelID = "914557391067054081"
const dailyTrivia = "711962609523621960"
const choicesSymbols = ["A", "B", "C", "D"]


module.exports = () => {
  const { client } = api

  const channel = client.channels.cache.get(channelID);

  client.on(Events.InteractionCreate, async (interaction) => { 
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('trivia_quiz:')) return;
      console.log(interaction)
			interaction.reply({ content: `Has seleccionado: ${interaction.values}`, ephemeral: true });
		
  })

  client.on(Events.MessageCreate, async (message) => {

    let emojis = ["🇦", "🇧", "🇨", "🇩"]
    if (message.content === "!trivia") {
      sendRandomDailyTrivia(message.channel, emojis);
    }
  })

  cron.schedule('0 14 * * *', () => {
    sendRandomDailyTrivia(channel);
  }, {
    scheduled: true,
    timezone: "Europe/Madrid"
  });
}

async function sendRandomDailyTrivia(channel, emojis) {
  try {
    const triviaData = await fetchTriviaQuestions();
    console.log(triviaData[0]);
    const choices = getChoices(triviaData[0]);
    const translatedText = await translate(triviaData[0].question.text, choices)

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Trivia #002" })
      .setTitle(translatedText.translations[0].text)
      .setDescription(
        "> **A**: "+translatedText.translations[1].text+"\n" +
        "> **B**: "+translatedText.translations[2].text+"\n" +
        "> **C**: "+translatedText.translations[3].text+"\n" +
        "> **D**: "+translatedText.translations[4].text+"" +
        "\n\n_Para reportar una pregunta incorrecta por favor utiliza el comando: \n`/reportar trivia [id] [motivo]`_")
      .setColor("#00b0f4")
      .setFooter({
        text: "r/Spain",
        iconURL: "https://media.discordapp.net/attachments/298140651676237824/1051478405897527316/rspainupscaled.png"
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('trivia_quiz:' + triviaData[0].id)
          .setPlaceholder('Selecciona una respuesta')
          .addOptions(choices.map((choice, index) => (
            new StringSelectMenuOptionBuilder()
              .setLabel(`${translatedText.translations[index + 1].text}`)
              .setEmoji(emojis[index])
              .setValue(choice)
          )))
      );
    const message = await channel.send({
      content: `<@&${dailyTrivia}>`,
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('Error in sendRandomDailyTrivia:', error);
  }
}

async function translate(question, choices) {
  try {
    const params = new URLSearchParams([
      ['target_lang', 'ES'],
      ['source_lang', 'EN'],
      ['context', "The following question is asked: " + question]
    ]);

    params.append('text', question);
    choices.forEach(choice => {
      params.append('text', choice);
    })

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': 'DeepL-Auth-Key f478b5f3-83a2-6a1c-aef1-b3b8430b7fde:fx'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error during translation:', error.message);
    throw error; // Rethrow the error if you want calling code to handle it as well
  }
}

async function fetchTriviaQuestions() {
  try {
    const baseUrl = 'https://the-trivia-api.com/v2/questions';
    const params = new URLSearchParams({
      limit: '25',
      difficulties: 'easy',
      region: 'ES',
      types: 'text_choice',
      tags: 'christmas,history,geography,society_and_culture,science,arts_and_literature'
    });

    const url = new URL(baseUrl);
    url.search = params;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error.message);
    throw error;
  }
}

function getChoices(response) {
  // Assuming 'response' is your question object
  let choices = [response.correctAnswer, ...response.incorrectAnswers];
  choices = shuffleArray(choices);

  return choices;
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}