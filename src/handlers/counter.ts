import { Guild } from 'discord.js'
import { BotClient } from '@structures/BotClient'
import { getSettings } from '@schemas/Guild'

interface CounterConfig {
  channel_id: string
  counter_type: string
  name: string
}

interface GuildSettings {
  counters: CounterConfig[]
  server: {
    bots: number
  }
  save: () => Promise<void>
}

interface GuildWithStats {
  fetchMemberStats: () => Promise<[number, number]> // [total, bots]
}

type GuildWithCustomClient = Guild & {
  client: BotClient
}

class CounterHandler {
  /**
   * Updates the counter channel for all the guildId's present in the update queue
   */
  async updateCounterChannels(client: BotClient): Promise<void> {
    client.counterUpdateQueue.forEach(async (guildId: unknown) => {
      if (typeof guildId !== 'string') return
      const guild = client.guilds.cache.get(guildId)
      if (!guild) return

      try {
        const settings = await getSettings(guild)

        const all = guild.memberCount
        const bots = settings.server.bots
        const members = all - bots

        for (const config of settings.counters) {
          const chId = config.channel_id
          const vc = guild.channels.cache.get(chId)
          if (!vc) continue

          let channelName: string | undefined
          const counterType = config.counter_type.toUpperCase()

          switch (counterType) {
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

          if (channelName && vc.manageable) {
            await vc
              .setName(channelName)
              .catch(err => client.logger.log('Set Name error: ', err))
          }
        }
      } catch (ex) {
        client.logger.error(
          `Error updating counter channels for guildId: ${guildId}`,
          ex as Error
        )
      } finally {
        // remove guildId from cache
        const i = client.counterUpdateQueue.indexOf(guildId)
        if (i > -1) client.counterUpdateQueue.splice(i, 1)
      }
    })
  }

  /**
   * Initialize guild counters at startup
   */
  async init(
    guild: GuildWithCustomClient & GuildWithStats,
    settings: GuildSettings
  ): Promise<boolean> {
    if (
      settings.counters.find(doc =>
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
}

// Export a singleton instance
const counterHandler = new CounterHandler()
export default counterHandler
