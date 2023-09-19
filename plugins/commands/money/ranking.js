const { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, codeBlock, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../economy.plugin');
const { getDefaultFooter } = require('../../utils/embeds')
const api = require("../../../core/api/api.js");


const {client} = api;

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('ranking')
    .setDescription('Obtén el ranking actual'),
  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    // console.log(currency)
    return await interaction.reply({
      embeds: [
        getDefaultFooter()
        .setAuthor({ name: 'Banco' })
        .setTitle('Ránking económico')
        .setColor('Gold')  
        .setDescription(leaderboardFormatter())
      ],
      ephemeral: true
    });
  },
};



function leaderboardFormatter() {
  return getLeaderboard(10).map((user, position) => `**${position + 1}°** ${(client.users.cache.get(user.user_id).toString())}:  \`${parseFloat(user.balance.toFixed(2))}₧\``).join('\n\n')
}