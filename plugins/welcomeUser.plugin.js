const { EmbedBuilder, Events } = require('discord.js');
const api = require("../core/api/api.js")

module.exports = () => {
  const { client } = api
  const channel = client.channels.cache.get("457208061392584725")
  client.on(Events.GuildMemberAdd, async member => {
    
    const { user, guild } = member;
    const username = (user.username + (user.discriminator === "0" ? "" : "#" + user.discriminator)).replaceAll("_", "\\_");

    const welcomeEmbed = new EmbedBuilder()
      .setColor("#8386ff")
      .setAuthor({ name: `Nuevo Usuario (${guild.memberCount})`, iconURL: "https://raw.githubusercontent.com/carlosmezquita/open-ticket/137b27f6b3b8a4a1fc34119ab001ed704d8a3ca4/storage/media/new_user.png" })
      .setTitle("¡Bienvenido al servidor de r/Spain!")
      .setDescription("Damos la bienvenida a **" + username + "** al Discord de r/Spain, ¡gracias por unirte!\n" +
        "_We welcome **" + username + "** to the r/Spain Discord, thanks for joining!_")
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: "Staff", iconURL: "https://media.discordapp.net/attachments/298140651676237824/1051478405897527316/rspainupscaled.png" })
      .setTimestamp()
    const msg = await channel.send({ embeds: [welcomeEmbed] })
    msg.react('👋')
  });
}