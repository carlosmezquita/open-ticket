const { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../../economy.plugin');
const user = require('../../models/Users');
const { embeds } = require('../../..');
const { bankEmbedWithOwner } = require('../../utils/embeds')

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('saldo')
    .setDescription('Obtén tu saldo actual'),
  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    try {
      getBalance(interaction.user.id)
        await interaction.reply({
          embeds: [
            bankEmbedWithOwner(interaction.member)
              .setDescription(
              '**Saldo: **`' + getBalance(interaction.user.id) + '₧`' +
              '\n\nPara aumentar su patrimonio participa en los eventos del servidor e interactúa con los demás usuarios.')
              .setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL() })
          ],
          ephemeral: true
        }).then(msg => {
          setTimeout(() => {
            msg.delete()
          }, 15000);
        });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Se ha producido un error al acceder a su saldo.', ephemeral: true
      });
    }
  },
};
