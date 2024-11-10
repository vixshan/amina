// ... (rest of your existing config)

// ... (rest of your existing config)

// manager.ts
import { LavalinkManager, NodeManager, SearchPlatform } from 'lavalink-client'
import { Client, Guild } from 'discord.js'
import config from '@/config'

interface CustomClient extends Client {
  logger: {
    success: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
  }
}

class Manager extends LavalinkManager {
  constructor(client: CustomClient) {
    super({
      nodes: config.MUSIC.LAVALINK_NODES,
      sendToShard: (guildId: string, payload: unknown) => {
        const guild = client.guilds.cache.get(guildId)
        return guild?.shard?.send(payload)
      },
      emitNewSongsOnly: false,
      queueOptions: {
        maxPreviousTracks: 30,
      },
      playerOptions: {
        defaultSearchPlatform: config.MUSIC.DEFAULT_SOURCE as SearchPlatform,
        onDisconnect: {
          autoReconnect: true,
          destroyPlayer: false,
        },
      },
      linksAllowed: true,
      linksBlacklist: ['porn'],
      linksWhitelist: [],
    })

    this.nodeManager.on('connect', node => {
      client.logger.success(`Lavalink node ${node.id} connected!`)
    })

    this.nodeManager.on('disconnect', (node, reason) => {
      client.logger.warn(
        `Lavalink node "${node.id}" disconnected. Reason: ${JSON.stringify(reason)}`
      )
    })

    this.nodeManager.on('error', (node, error: Error) => {
      client.logger.error(
        `Error occurred on Lavalink node "${node.id}": ${error.message}`
      )
    })

    this.nodeManager.on('destroy', node => {
      client.logger.warn(`Lavalink node "${node.id}" destroyed`)
    })
  }
}

export default Manager
