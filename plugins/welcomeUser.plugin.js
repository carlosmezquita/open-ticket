const https = require('https');
const { Client, EmbedBuilder, GatewayIntentBits, Events } = require('discord.js');
const { token } = require('./config.json');
const { channel } = require('diagnostics_channel');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] });
module.exports = () => {
  const { client } = api
  const channel = client.channels.cache.get("667125197190725642")
  client.once(Events.GuildMemberAdd, async member => {
    
    const { user, guild } = member;
    const username = (user.username + user.discriminator == "0" ? "" : "#" + user.discriminator).replace("_","\\_");

    const welcomeEmbed = new EmbedBuilder()
      .setColor("#90FCF9")
      .setAuthor({ name: `Nuevo Usuario (${guild.memberCount})`, iconURL: "https://raw.githubusercontent.com/carlosmezquita/open-ticket/137b27f6b3b8a4a1fc34119ab001ed704d8a3ca4/storage/media/new_user.png" })
      .setTitle("¡Bienvenido al servidor de r/Spain!")
      .setDescription("Damos la bienvenida a " + username + " al Discord de r/Spain, ¡gracias por unirte!\n" +
        "_We welcome " + user.tag + " to the r/Spain Discord, thanks for joining!_")
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: "Staff", iconURL: "https://media.discordapp.net/attachments/298140651676237824/1051478405897527316/rspainupscaled.png" })
      .setTimestamp()
    const msg = await channel.send({ embeds: [welcomeEmbed] })
    msg.react('👋')
  });
}