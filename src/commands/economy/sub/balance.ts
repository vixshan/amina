import { EmbedBuilder } from 'discord.js'
import { getUser } from '@schemas/User'
import config from '@src/config'

export default async user => {
  const economy = await getUser(user)

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: user.username })
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: 'Wallet',
        value: `${economy?.coins || 0}${config.ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'Bank',
        value: `${economy?.bank || 0}${config.ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'Net Worth',
        value: `${(economy?.coins || 0) + (economy?.bank || 0)}${config.ECONOMY.CURRENCY}`,
        inline: true,
      }
    )

  return { embeds: [embed] }
}
