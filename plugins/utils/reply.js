module.exports.sendResponse = async function ({ interaction, content = '', embeds = null }) {
	interaction.reply({
		content: content,
		embeds: embeds,
		ephemeral: true
	}).then(msg => {
		setTimeout(() => {
			msg.delete()
		}, 20000);
	})
}