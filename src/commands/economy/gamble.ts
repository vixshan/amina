import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js'
import { getUser } from '@schemas/User'
import { Utils } from '@helpers/Utils'
import config from '@src/config'

/**
 * @type {import("@structures/Command")}
 */
export default {
  name: 'gamble',
  description: 'try your luck by gambling',
  category: 'ECONOMY',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: config.ECONOMY.ENABLED,
    options: [
      {
        name: 'coins',
        description: 'number of coins to bet',
        required: true,
        type: ApplicationCommandOptionType.Integer,
      },
    ],
  },

  async interactionRun(interaction) {
    const betAmount = interaction.options.getInteger('coins')
    const response = await gamble(interaction.user, betAmount)
    await interaction.followUp(response)
  },
}

function getEmoji() {
  const ran = Utils.getRandomInt(9)
  switch (ran) {
    case 1:
      return '\uD83C\uDF52'
    case 2:
      return '\uD83C\uDF4C'
    case 3:
      return '\uD83C\uDF51'
    case 4:
      return '\uD83C\uDF45'
    case 5:
      return '\uD83C\uDF49'
    case 6:
      return '\uD83C\uDF47'
    case 7:
      return '\uD83C\uDF53'
    case 8:
      return '\uD83C\uDF50'
    case 9:
      return '\uD83C\uDF4D'
    default:
      return '\uD83C\uDF52'
  }
}

function calculateReward(amount, var1, var2, var3) {
  if (var1 === var2 && var2 === var3) return 3 * amount
  if (var1 === var2 || var2 === var3 || var1 === var3) return 2 * amount
  return 0
}

async function gamble(user, betAmount) {
  if (isNaN(betAmount)) return 'Bet amount needs to be a valid number input'
  if (betAmount < 0) return 'Bet amount cannot be negative'
  if (betAmount < 10) return 'Bet amount cannot be less than 10'

  const userDb = await getUser(user)
  if (userDb.coins < betAmount)
    return `You do not have sufficient coins to gamble!\n**Coin balance:** ${userDb.coins || 0}${config.ECONOMY.CURRENCY}`

  const slot1 = getEmoji()
  const slot2 = getEmoji()
  const slot3 = getEmoji()

  const str = `
    **Gamble Amount:** ${betAmount}${config.ECONOMY.CURRENCY}
    **Multiplier:** 2x
    ╔══════════╗
    ║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ‎‎‎‎║
    ╠══════════╣
    ║ ${slot1} ║ ${slot2} ║ ${slot3} ⟸
    ╠══════════╣
    ║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ║
    ╚══════════╝
    `

  const reward = calculateReward(betAmount, slot1, slot2, slot3)
  const result =
    (reward > 0 ? `You won: ${reward}` : `You lost: ${betAmount}`) +
    config.ECONOMY.CURRENCY
  const balance = reward - betAmount

  userDb.coins += balance
  await userDb.save()

  const embed = new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setThumbnail(
      'https://i.pinimg.com/originals/9a/f1/4e/9af14e0ae92487516894faa9ea2c35dd.gif'
    )
    .setDescription(str)
    .setFooter({
      text: `${result}\nUpdated Wallet balance: ${userDb?.coins}${config.ECONOMY.CURRENCY}`,
    })

  return { embeds: [embed] }
}
