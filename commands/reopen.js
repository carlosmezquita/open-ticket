const discord = require('discord.js')
const bot = require('../index')
const client = bot.client
const config = bot.config
const log = bot.errorLog.log
const l = bot.language
const permsChecker = require("../core/utils/permisssionChecker")

module.exports = () => {
    var reopenCommandBar = new discord.ActionRowBuilder()
        .addComponents(
            new discord.ButtonBuilder()
                .setCustomId("reopenTicket1")
                .setDisabled(false)
                .setStyle(discord.ButtonStyle.Secondary)
                .setEmoji("🔓")
        )
    
    client.on("messageCreate",msg => {
        if (!msg.content.startsWith(config.prefix+"reopen")) return

        msg.channel.messages.fetchPinned().then(msglist => {
            var firstmsg = msglist.last()

            if (firstmsg == undefined || firstmsg.author.id != client.user.id) return msg.channel.send({embeds:[bot.errorLog.notInATicket]})

            msg.channel.send({embeds:[bot.errorLog.success(l.commands.reopenTitle,l.commands.reopenDescription)],components:[reopenCommandBar]})

            
            log("command","someone used the 'reopen' command",[{key:"user",value:msg.author.tag}])
        })
        
    })

    client.on("interactionCreate",async (interaction) => {
        if (!interaction.isChatInputCommand()) return
        if (interaction.commandName != "reopen") return

        await interaction.deferReply()

        interaction.channel.messages.fetchPinned().then(async msglist => {
            var firstmsg = msglist.last()

            if (firstmsg == undefined || firstmsg.author.id != client.user.id) return msg.channel.send({embeds:[bot.errorLog.notInATicket]})

            try {
                await interaction.reply({embeds:[bot.errorLog.success(l.commands.reopenTitle,l.commands.reopenDescription)],components:[reopenCommandBar]})
            }catch{
                await interaction.editReply({embeds:[bot.errorLog.success(l.commands.reopenTitle,l.commands.reopenDescription)],components:[reopenCommandBar]})
            }

            
            log("command","someone used the 'reopen' command",[{key:"user",value:interaction.user.tag}])
        })

       
    })
}