const { SlashCommandBuilder, ChatInputCommandInteraction, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const command = new SlashCommandBuilder()
		.setName('dinero')
		.setDescription('Operaciones con tu dinero')

const subcommands = new Collection();
const commandsPath = path.join(__dirname, 'money');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const subcommand = require(filePath); 
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in subcommand && 'execute' in subcommand) {
		command.addSubcommand(subcommand.data)
		subcommands.set(subcommand.data.name, subcommand);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

module.exports = {
	data: command,
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {

			if (!interaction.isChatInputCommand()) return;
		
			const subcommand = subcommands.get(interaction.options.getSubcommand());
		
			await subcommand.execute(interaction);

	},
};
