import { getSettings } from '@schemas/Guild'

/**
 * Updates the counter channel for all the guildId's present in the update queue
 * @param {import('@src/structures').BotClient} client
 */
export const updateCounterChannels = async client => {
  for (const guildId of client.counterUpdateQueue) {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) continue

    try {
      const settings = await getSettings(guild)

      const all = guild.memberCount
      const bots = settings.server.bots
      const members = all - bots

      for (const config of settings.counters) {
        const chId = config.channel_id
        const vc = guild.channels.cache.get(chId)
        if (!vc) continue

        let channelName
        switch (config.counter_type.toUpperCase()) {
          case 'USERS':
            channelName = `${config.name} : ${all}`
            break
          case 'MEMBERS':
            channelName = `${config.name} : ${members}`
            break
          case 'BOTS':
            channelName = `${config.name} : ${bots}`
            break
        }

        if (vc.manageable) {
          try {
            await vc.setName(channelName)
          } catch (err) {
            vc.client.logger.log('Set Name error: ', err)
          }
        }
      }
    } catch (ex) {
      client.logger.error(
        `Error updating counter channels for guildId: ${guildId}`,
        ex
      )
    } finally {
      // remove guildId from cache
      const i = client.counterUpdateQueue.indexOf(guild.id)
      if (i > -1) client.counterUpdateQueue.splice(i, 1)
    }
  }
}

/**
 * Initialize guild counters at startup
 * @param {import("discord.js").Guild} guild
 * @param {Object} settings
 */
export const init = async (guild, settings) => {
  if (
    settings.counters.some(doc =>
      ['MEMBERS', 'BOTS'].includes(doc.counter_type.toUpperCase())
    )
  ) {
    const stats = await guild.fetchMemberStats()
    settings.server.bots = stats[1] // update bot count in database
    await settings.save()
  }

  // schedule for update
  if (!guild.client.counterUpdateQueue.includes(guild.id)) {
    guild.client.counterUpdateQueue.push(guild.id)
  }
  return true
}

export default { init, updateCounterChannels }
