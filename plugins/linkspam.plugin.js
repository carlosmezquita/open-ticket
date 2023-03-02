const { Events, EmbedBuilder, PermissionsBitField  } = require('discord.js');
const api = require("../core/api/api.js")
module.exports = () => {
    const {client,config,events,utils,actions} = api

    const recentLink = new Set();
    //Cooldown in seconds
    cooldown = 60 * 1000;

    const unsafeLinkMsg = new EmbedBuilder()
    .setTitle(`:warning: ATENCIÓN`)
    .setDescription("Esta prohibido enviar enlaces que no usen un protocolo seguro (https) en el servidor de 'r/Spain Discord'\n\nIncumplir esta norma puede resultar en una expulsión inmediata.")
    .setColor("#f4af1b")

    const rateLinkMsg = new EmbedBuilder()
    .setTitle(`:warning: ATENCIÓN`)
    .setDescription("Has excedido el límite de envío de enlaces (1/60s) permitido por el servidor de 'r/Spain Discord'. Por favor, espera antes de enviar más enlaces.\n\nIncumplir esta norma puede resultar en una expulsión inmediata.")
    .setColor("f4af1b")


    const urlRegex = httpRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;
    const unsafeUrlRegex = /http:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;
    // Listen for the 'message' event
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot || message.member.permissions.has(PermissionsBitField.Flags.Administrator) || message.member.roles.cache.has("960199533927727144") || message.member.roles.cache.has("298102471040172032")) return;
        if (unsafeUrlRegex.test(message.content)) {
            message.author.send({ embeds: [unsafeLinkMsg] })
            message.delete()
            return;
        }
        if (urlRegex.test(message.content)) {
            if (recentLink.has(message.author.id)) {
                await message.reply({ embeds: [rateLinkMsg]});
                message.delete();
                return;
            }
            recentLink.add(message.author.id);
            setTimeout(() => {
            // Removes the user from the set after x seconds
            recentLink.delete(message.author.id);
            }, cooldown);
        }
    })
}