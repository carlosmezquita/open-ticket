const { Events, EmbedBuilder, PermissionsBitField  } = require('discord.js');
const api = require("../core/api/api.js")

const recentLink = new Map();
//Cooldown in seconds

const cooldownSecs = 60;
const warnsLimit = 3

const sendAlert = true;

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;
const unsafeUrlRegex = /http:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;
const whitelistLinks = ["https://tenor.com/view/", "https://media.discordapp.net/", "https://cdn.discordapp.com/"]
const whitelistRoles = ["960199533927727144", "298102471040172032", "1131596076097474731"]

/**
 * 
 * @param {String} message 
 * @returns {Array<String>}
 */
function extractLinks(message) {
    const regex = /(https?:\/\/[\w\-+%?=&#]+\.[\w\-+%?=&#]+[^\s"']*)/g;
    // const regex = /((?:https?:\/\/)?(?:www\.)?[\w\-+%?=&#]+\.[\w\-+%?=&#]+[^\s"']*)/g; //all kinds of links, even if they dont start with http
    const links = message.match(regex);
    return links || [];
}

/**
 * 
 * @param {Array<String>} linkList
 * @returns {boolean}
 */
function areLinksWhitelisted(linkList) {
    for (let link of linkList) {
      if (!isLinkWhitelisted(link)) return false;
    }  
    return true;
}
  
/**
* 
* @param {String} url
* @returns {boolean}
*/
function isLinkWhitelisted(url) {
  for (let domain of whitelistLinks) {
    if (url.startsWith(domain)) return true   
  }
  return false;
}

async function rateLimitedAction(message, channel, userRateLimitData) {
    userRateLimitData.counter++;
    if (userRateLimitData.counter < warnsLimit) {
        try {
            message.author.send({
                embeds: [new EmbedBuilder()
                    .setTitle(`:warning: ATENCIÓN`)
                    .setDescription(`Has excedido el límite de envío de enlaces (1/${cooldownSecs}s) permitido por el servidor de 'r/Spain Discord'. Por favor, espera antes de enviar más enlaces.\n\nIncumplir esta norma puede resultar en una expulsión inmediata.`)
                    .addFields({ name: "Avisos", value: userRateLimitData.counter + "/" + warnsLimit, inline: true })
                    .setFooter({ text: `Tus avisos expirarán a los ${cooldownSecs} segundos.`})
                    .setColor("f4af1b")]
            });
        } catch (err) {
            console.error(err);
        }
        
    }
    if (sendAlert) {
        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: "Alerta" })
                    .setTitle("Protección automática contra spam.")
                    .setDescription("El usuario ha superado la tasa permitida de envío de enlaces")
                    .addFields(
                        { name: "Autor", value: message.author.toString(), inline: true },
                        { name: `Avisos (${cooldownSecs}s)`, value: userRateLimitData.counter + "/" + warnsLimit, inline: true },
                        { name: "Canal", value: message.channel.toString(), inline: true },
                        { name: 'Mensaje', value: message.content, inline: false }
                    )
                    .setFooter({ text: "Peligro de nivel medio." })
                    .setColor("F00000")
            ]
        });
    }
    message.delete();
    if (userRateLimitData.counter == warnsLimit) {
        const member = await message.guild.members.fetch(message.author.id)
        try {
            await member.send({embeds:[
                new EmbedBuilder()
                    .setTitle("Expulsión Automática")
                    .setDescription("Has sido expulsado del servidor por superar el límite de envío de enlaces en múltiples ocasiones.")
                    .addFields({ name: `Avisos`, value: userRateLimitData.counter + "/" + warnsLimit, inline: true })
                    .setFooter({ text: "Staff de r/Spain", iconURL: "https://media.discordapp.net/attachments/298140651676237824/1051478405897527316/rspainupscaled.png?width=1280&height=1280" })
                    .setTimestamp()
                    .setColor("0a0908")
            ]})
        } catch(err) {
            console.error(err)
        }
        
        channel.send({
            embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Alerta" })
                .setTitle("Expulsión automática")
                .setDescription(`Se ha expulsado a ${message.author.toString()} por superar el límite de envío de enlaces en múltiples ocasiones.`)
                .addFields(
                    { name: "Nombre", value: message.author.tag, inline: true },
                    { name: "Se unió:", value: member.joinedAt.getDate() + "/" + (member.joinedAt.getMonth() + 1) + "/" + member.joinedAt.getFullYear(), inline: true },
                    {name: `Avisos (${cooldownSecs}s)`, value: userRateLimitData.counter + "/" + warnsLimit, inline: true }
                )
                .setTimestamp()
                .setColor("0a0908")
        ]})  
        member.ban({ deleteMessageSeconds: 12 * 3600, reason: "Automatic ban for exceeding the link rate limit multiple times." })
    }
    return;
}

function unsafeLinkAction(message, channel) {
    message.author.send({
        embeds: [new EmbedBuilder()
        .setTitle(`:warning: ATENCIÓN`)
        .setDescription("Esta prohibido enviar enlaces que no usen un protocolo seguro (https) en el servidor de 'r/Spain Discord'\n\nIncumplir esta norma puede resultar en una expulsión inmediata.")
        .setColor("#f4af1b")] });
    if (sendAlert) {
        channel.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: "Alerta" })
                    .setTitle("Protección automática contra enlaces maliciosos.")
                    .setDescription("El usuario ha enviado un enlace con un protocolo inseguro (http)")
                    .addFields(
                        { name: "Autor", value: message.author.toString(), inline: true },
                        { name: "Canal", value: message.channel.toString(), inline: true },
                        { name: 'Mensaje', value: message.content, inline: false }
                    )
                    .setFooter({ text: "Peligro de nivel medio-bajo." })
                    .setColor("FFC917")
            ]
        });
    }
    message.delete();
}

module.exports = () => {
    const {client} = api

    // Listen for the 'message' event
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot ||
            message.member.permissions.has(PermissionsBitField.Flags.Administrator) || 
            message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return;
        }

        for (const role in whitelistRoles) {
            if(message.member.roles.cache.has(role)) return;
        }
        
        const alertsChannel = client.channels.cache.get('1079816654269194384');

        const linkList = extractLinks(message.content)

        if (linkList.length == 0) return;

        if (areLinksWhitelisted(linkList)) {
            return
        };

        // if (unsafeUrlRegex.test(message.content)) {
        //     unsafeLinkAction(message, alertsChannel);
        //     return;
        // }

        const userRateLimitData = recentLink.get(message.author.id);

        if (userRateLimitData) {
            return rateLimitedAction(message, alertsChannel, userRateLimitData);
        }

        recentLink.set(message.author.id, { counter: 0, invokingMessageId: message.id, invokingMessage: message.content })
        
        setTimeout(() => {
        // Removes the user from the set after x seconds
        recentLink.delete(message.author.id);
        }, cooldownSecs * 1000);
    })
}
