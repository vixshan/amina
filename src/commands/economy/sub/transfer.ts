import { EmbedBuilder } from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY, EMBED_COLORS } from '@/src/config'

export default async (self, target, coins) => {
  if (isNaN(coins) || coins <= 0)
    return 'Please enter a valid amount of coins to transfer'
  if (target.bot) return 'You cannot transfer coins to bots!'
  if (target.id === self.id) return 'You cannot transfer coins to self!'

  const userDb = await getUser(self)

  if (userDb.bank < coins) {
    return `Insufficient bank balance! You only have ${userDb.bank}${ECONOMY.CURRENCY} in your bank account.${
      userDb.coins > 0 &&
      '\nYou must deposit your coins in bank before you can transfer'
    } `
  }

  const targetDb = await getUser(target)

  userDb.bank -= coins
  targetDb.bank += coins

  await userDb.save()
  await targetDb.save()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: 'Updated Balance' })
    .setDescription(
      `You have successfully transferred ${coins}${ECONOMY.CURRENCY} to ${target.username}`
    )
    .setTimestamp(Date.now())

  return { embeds: [embed] }
}
