const {EmbedBuilder} = require('discord.js')

const defaultFooter = { text: 'r/Spain', iconURL: 'https://media.discordapp.net/attachments/298140651676237824/1051478405897527316/rspainupscaled.png' }

module.exports.bankEmbed = new EmbedBuilder()
      // .setAuthor({ name: 'Cuenta Bancaria' })
      .setTitle('Cuenta Bancaria')
      .setFooter(defaultFooter)
      .setTimestamp(Date.now())
      .setColor('Gold')

module.exports.bankEmbedWithOwner = (member) => {
      return this.bankEmbed.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
}

module.exports.defaultFooter = defaultFooter

module.exports.getDefaultFooter = () => {
      return new EmbedBuilder()
            .setFooter(defaultFooter)
            .setTimestamp(Date.now())
}