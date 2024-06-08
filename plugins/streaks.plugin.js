const { Events  } = require('discord.js');
const api = require("../core/api/api.js")
const fs = require('fs');
const { config } = require("../index.js")
  
function getUserId(users, userId) {
  for (const user of users) {
    if (user.id === userId) {
      return user;
    }
  }
}

function getDateMidnightUnixTime(date) {
  date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

function getDay(message) {
  const msgDate = new Date(message.createdAt)
  msgDate.setHours(msgDate.getHours() - new Date().getTimezoneOffset()/60)

  if (msgDate.getHours() < 14) {
    return msgDate.setDate(msgDate.getDate() - 1);
  } else {
    return msgDate;
  }
}

hasAnOngoingStreak = (message) => {
  const filePath = './storage/streaks.json';

  let users = JSON.parse(fs.readFileSync(filePath, "utf8"));;
  if (!users) return

  let user = getUserId(users, message.author.id)
  const today = getDateMidnightUnixTime(getDay(message))

  if (user) {
    const lastMessageDate = getDateMidnightUnixTime(getDay(message));

    if (lastMessageDate === user.lastMessageDate) {
      return;
    }

    user.lastMessageDate = lastMessageDate;

    if (lastMessageDate && today - lastMessageDate <= 864000 ) {
      user.streak++;
      message.react('🔥');
      api.client.channels.cache.get(config.channels.botChannel)
      .send(`La racha actual de ${message.author.toString()} es de ${user.streak} días.`);
    } else {
      user.streak = 1;
      api.client.channels.cache.get(config.channels.botChannel)
      .send(` ${message.author.toString()} ha empezado una nueva racha.`);
    }
    

  } else {
    users.push({
      id: message.author.id,
      lastMessageDate: getDateMidnightUnixTime(getDay(message)),
      streak: 1
    });
    api.client.channels.cache.get(config.channels.botChannel)
      .send(`¡Hola ${message.author.toString()}!\n\nHas empezado tu primera racha.\nPara mantenerla debes enviar un 'spaincraft' diario.\n\n¡Sigue así!`);
  }

  const jsonString = JSON.stringify(users, null, 2);
  fs.writeFile(filePath, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file', err);
    }
  });
}


module.exports = () => {
  const {client} = api

  client.on(Events.MessageCreate, async (message) => {    
      if (message.author.bot ||
          message.channel.id !== config.channels.streaksChannel) {
              return;
      }

    if (message.content.toLowerCase().includes("spaincraft")) {  
        hasAnOngoingStreak(message);
      }

    })
}
