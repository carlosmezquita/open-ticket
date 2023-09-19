const { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, codeBlock } = require('discord.js');
const { transferBalance, getBalance } = require('../../economy.plugin');
const { bankEmbedWithOwner } = require('../../utils/embeds')
const { sendResponse } = require('../../utils/reply')

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('transferir')
		.setDescription('Transfiere dinero a otro jugador.')
		.addUserOption(option =>
			option
				.setName('usuario')
				.setDescription('Usuario a quien le quieres hacer la transferencia.')
				.setRequired(true)
		).addNumberOption(option =>
			option
				.setName('cantidad')
				.setDescription('Cantidad a ser transferida.')
				.setMinValue(1)
				.setMaxValue(1000000)
				.setRequired(true)),
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const sender = interaction.user
		const receiver = interaction.options.get('usuario').user
		const amount = parseFloat(interaction.options.get('cantidad').value.toFixed(2))

		if (receiver.id === sender.id) {
			return sendResponse({ content: 'No te puedes hacer una transferencia a ti mismo.', interaction })
		}

		if (receiver.bot) {
			return await sendResponse({ content: 'No se pueden hacer transferencias a bots.', interaction })
		}

		if (amount < 1) {
			return await sendResponse({ content: 'No se pueden hacer transferencias de importes menores a 1₧', interaction })
		}
		let msg = ''
		try {
			const result = await transferBalance(sender.id, receiver.id, amount)
			if (result === 'not-enough-balance') {
				msg = 'No se ha podido realizar la transferencia porque no dispones de  suficiente dinero.'
			} else if (result === 'money-succesfully-transfered') {
				msg = 'Se han transferido `' + amount + '₧` al usuario ' + receiver.toString()
			}
		} catch (error) {
			console.error(error);
			return await sendResponse({ content: 'Se produjo un error al realizar la transferencia', interaction })
		}

		return await sendResponse({
			embeds: [
				bankEmbedWithOwner(interaction.member)
					.setDescription(
						msg + "\n\n" +
						'**Saldo: **`' + getBalance(interaction.user.id) + '₧`')],
			interaction
		})
	}

}

