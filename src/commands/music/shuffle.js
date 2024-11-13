const { musicValidations } = require('@helpers/BotUtils')

/**
 * @type {import("@structures/Command")}
 */
export default {
  name: 'shuffle',
  description: 'shuffle the queue',
  category: 'MUSIC',
  validations: musicValidations,
  command: {
    enabled: false,
  },

  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction) {
    const response = shuffle(interaction)
    await interaction.followUp(response)
  },
}

/**
 * @param {import("discord.js").CommandInteraction} interaction
 */
function shuffle({ client, guildId }) {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.curren) {
    return "🚫 There's no music currently playing"
  }

  if (player.queue.tracks.length < 2) {
    return '🚫 Not enough tracks to shuffle'
  }

  player.queue.shuffle()
  return '🎶 Queue has been shuffled'
}
