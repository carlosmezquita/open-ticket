const bot = require('../index')
const client = bot.client
const config = bot.config
const log = bot.errorLog.log
const l = bot.language
const permsChecker = require("../core/utils/permisssionChecker")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = bot.storage

const DISABLE = require("../core/api/api.json").disable
module.exports = () => {
    bot.errorLog.log("debug","COMMANDS: loaded place.js")
  if (!DISABLE.commands.slash.place) client.on("interactionCreate", (interaction) => {
      if (!interaction.isChatInputCommand()) return
      if (interaction.commandName != "place") return
          if (!interaction.guild) return
          if (!permsChecker.command(interaction.user.id,interaction.guild.id)){
            interaction.reply({content: "Para toda la información sobre el r/Place accede a la categoría de r/Place", ephemeral: true})
              return
          }

          interaction.reply({content:"Enviando mensaje", ephemeral: true})
          const giveRoleButton = new ButtonBuilder()
          .setCustomId('give_rplace2023_role')
          .setLabel('Obtener Rol')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔔');
          
          const row = new ActionRowBuilder()
            .addComponents(giveRoleButton);
    
            const embed = new EmbedBuilder()
            .setColor("#FF5700")
            .setAuthor({ name: `r/Place 2023`, iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Place_2022.svg/1200px-Place_2022.svg.png" })
            .setTitle("¡Ha vuelto r/Place!")
              .setDescription("Queridos miembros del servidor,\n" +
                "Ha vuelto el evento más grande de nuestra comunidad el r/Place. Como cada año aquí en el Discord nos organizaremos para representar a la comunidad de r/Spain.\n" +
                "Usaremos los canales que se encuentran en la categoría de Place, donde se realizarán las votociones y discusiones pertinentes.")
              .setFields({name: "Rol de r/Place 2023", value: "Para poder recibir las última noticias relacioandas con este evento por favor pulsa el botón y así te asignaremos el rol."})
            .setFooter({ text: "Staff", iconURL: "https://media.discordapp.net/attachments/298140651676237824/1051478405897527316/rspainupscaled.png" })
            .setTimestamp()
          
          // interaction.reply({content:l.commands.ticketWarning})
          interaction.channel.send({content: "@/everyone", embeds:[embed],components:[row]})
  })
}