import { ActivityType, PresenceStatusData, Client } from 'discord.js'
import { devConfigManager } from '@schemas/Dev'

// Custom types
interface BotClient extends Client {
  logger: {
    log: (message: string) => void
  }
}

interface PresenceConfig {
  PRESENCE: {
    ENABLED: boolean
    MESSAGE: string
    TYPE:
      | 'COMPETING'
      | 'LISTENING'
      | 'PLAYING'
      | 'WATCHING'
      | 'STREAMING'
      | 'CUSTOM'
    STATUS: PresenceStatusData
    URL?: string
  }
}

async function updatePresence(client: BotClient): Promise<void> {
  const config = (await devConfigManager.getPresenceConfig()) as PresenceConfig

  if (!config.PRESENCE.ENABLED) {
    await client.user?.setPresence({
      status: 'invisible',
      activities: [],
    })
    return
  }

  let message = config.PRESENCE.MESSAGE

  if (message.includes('{servers}')) {
    message = message.replaceAll(
      '{servers}',
      client.guilds.cache.size.toString()
    )
  }

  if (message.includes('{members}')) {
    const members = client.guilds.cache
      .map(g => g.memberCount)
      .reduce((partial_sum, a) => partial_sum + a, 0)
    message = message.replaceAll('{members}', members.toString())
  }

  const getType = (type: PresenceConfig['PRESENCE']['TYPE']): ActivityType => {
    switch (type) {
      case 'COMPETING':
        return ActivityType.Competing
      case 'LISTENING':
        return ActivityType.Listening
      case 'PLAYING':
        return ActivityType.Playing
      case 'WATCHING':
        return ActivityType.Watching
      case 'STREAMING':
        return ActivityType.Streaming
      case 'CUSTOM':
        return ActivityType.Custom
      default:
        return ActivityType.Playing
    }
  }

  const activity: {
    name: string
    type: ActivityType
    url?: string
    state?: string
  } = {
    name: message,
    type: getType(config.PRESENCE.TYPE),
  }

  // Handle streaming activity type with URL support
  if (config.PRESENCE.TYPE === 'STREAMING' && config.PRESENCE.URL) {
    activity.url = config.PRESENCE.URL
  }

  // Handle custom status with emoji and state
  if (config.PRESENCE.TYPE === 'CUSTOM') {
    activity.state = config.PRESENCE.MESSAGE
  }

  await client.user?.setPresence({
    status: config.PRESENCE.STATUS,
    activities: [activity],
  })

  // Log the presence update
  client.logger.log(
    `Presence Updated: STATUS:${config.PRESENCE.STATUS}, TYPE:${config.PRESENCE.TYPE}`
  )
}

export default async function handlePresence(client: BotClient): Promise<void> {
  await updatePresence(client)
  setInterval(() => updatePresence(client), 10 * 60 * 1000)
}
