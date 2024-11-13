import { EmbedBuilder } from 'discord.js'
import { getUser } from '@schemas/User'
import config from '@src/config'

export default async (user, coins) => {
  if (isNaN(coins) || coins <= 0)
    return 'Please enter a valid amount of coins to deposit'

  const userDb = await getUser(user)

  if (coins > userDb.bank)
    return `You only have ${userDb.bank}${config.ECONOMY.CURRENCY} coins in your bank`

  userDb.bank -= coins
  userDb.coins += coins
  await userDb.save()

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: 'New Balance' })
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: 'Wallet',
        value: `${userDb.coins}${config.ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'Bank',
        value: `${userDb.bank}${config.ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'Net Worth',
        value: `${userDb.coins + userDb.bank}${config.ECONOMY.CURRENCY}`,
        inline: true,
      }
    )

  return { embeds: [embed] }
}
