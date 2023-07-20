const { EmbedBuilder, Events } = require('discord.js');
const api = require("../core/api/api.js")

const role = "1118642400357777579";

module.exports = () => {
  const { client } = api
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === "give_rplace2023_role") {
      const { user, member } = interaction
      if (!interaction.guild.members.cache.find(u => u.id == user.id).roles.cache.has(role)){
        interaction.guild.members.cache.find(u => u.id == user.id).roles.add(role)

        interaction.guild.roles.cache.find(r => r.id == role)
    }else {
        interaction.guild.members.cache.find(u => u.id == user.id).roles.remove(role)

        interaction.guild.roles.cache.find(r => r.id == role)
    }
      
    }
  })}

