const {
  counterHandler,
  inviteHandler,
  presenceHandler,
} = require('@src/handlers')
const { cacheReactionRoles } = require('@schemas/ReactionRoles')
const { getSettings } = require('@schemas/Guild')
const { getPresenceConfig, getDevCommandsConfig } = require('@schemas/Dev')
const {
  ApplicationCommandType,
  ApplicationCommandData,
  Client,
} = require('discord.js')

/**
 * @param {Client} client
 */
module.exports = async (client: {
  logger: {
    success: (arg0: string) => void
    log: (arg0: string) => void
  }
  user: {
    tag: string
    id: string
  }
  config: {
    MUSIC: { ENABLED: boolean }
    GIVEAWAYS: { ENABLED: boolean }
    INTERACTIONS: {
      SLASH: boolean
      CONTEXT: boolean
      GLOBAL: boolean
    }
  }
  musicManager: { init: (arg0: any) => void }
  giveawaysManager: { _init: () => Promise<any> }
  guilds: {
    cache: {
      size: number
      map: (arg0: (g: any) => any) => any[]
      get: (arg0: string | undefined) => any
      values: () => any
    }
  }
  application: {
    commands: {
      set: (commands: (typeof ApplicationCommandData)[]) => Promise<any>
    }
  }
  slashCommands: Array<{
    name: string
    description: string
    testGuildOnly?: boolean
    devOnly?: boolean
    slashCommand: {
      options: any[]
    }
  }>
}) => {
  client.logger.success(`Logged in as ${client.user.tag}! (${client.user.id})`)

  // Initialize Music Manager
  if (client.config.MUSIC.ENABLED) {
    client.musicManager.init({ ...client.user, shards: 'auto' })
    client.logger.success('Music Manager initialized')
  }

  // Initialize Giveaways Manager
  if (client.config.GIVEAWAYS.ENABLED) {
    client.logger.log('Initializing the giveaways manager...')
    client.giveawaysManager
      ._init()
      .then(() => client.logger.success('Giveaway Manager is up and running!'))
  }

  // Initialize Presence Handler
  const presenceConfig = await getPresenceConfig()
  if (presenceConfig.PRESENCE.ENABLED) {
    await presenceHandler(client)

    const logPresence = () => {
      let message = presenceConfig.PRESENCE.MESSAGE

      if (message.includes('{servers}')) {
        message = message.replaceAll(
          '{servers}',
          client.guilds.cache.size.toString()
        )
      }

      if (message.includes('{members}')) {
        const members = client.guilds.cache
          .map((g: { memberCount: number }) => g.memberCount)
          .reduce((partial_sum: number, a: number) => partial_sum + a, 0)
        message = message.replaceAll('{members}', members.toString())
      }

      client.logger.log(
        `Presence: STATUS:${presenceConfig.PRESENCE.STATUS}, TYPE:${presenceConfig.PRESENCE.TYPE}`
      )
    }

    logPresence()
  }

  // Register Interactions
  if (client.config.INTERACTIONS.SLASH || client.config.INTERACTIONS.CONTEXT) {
    const devConfig = await getDevCommandsConfig()

    if (!client.config.INTERACTIONS.GLOBAL) {
      await client.application.commands.set([])
      client.logger.success('Cleared all global commands (GLOBAL=false)')
    }

    const testGuild = client.guilds.cache.get(process.env.TEST_GUILD_ID)
    if (testGuild) {
      const testGuildCommands: (typeof ApplicationCommandData)[] =
        client.slashCommands
          .filter(
            cmd =>
              cmd.testGuildOnly ||
              (cmd.devOnly && devConfig.ENABLED) ||
              (!cmd.testGuildOnly &&
                !cmd.devOnly &&
                client.config.INTERACTIONS.GLOBAL)
          )
          .map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            type: ApplicationCommandType.ChatInput,
            options: cmd.slashCommand.options,
          }))

      if (testGuildCommands.length > 0) {
        await testGuild.commands.set(testGuildCommands)
        client.logger.success(
          `Registered ${testGuildCommands.length} test guild commands`
        )
      }
    }

    // Register global commands
    if (client.config.INTERACTIONS.GLOBAL) {
      const globalCommands: (typeof ApplicationCommandData)[] =
        client.slashCommands
          .filter(cmd => !cmd.testGuildOnly && !cmd.devOnly)
          .map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            type: ApplicationCommandType.ChatInput,
            options: cmd.slashCommand.options,
          }))

      if (globalCommands.length > 0) {
        await client.application.commands.set(globalCommands)
        client.logger.success(
          `Registered ${globalCommands.length} global commands`
        )
      }
    }
  }

  // Load reaction roles to cache
  await cacheReactionRoles(client)

  for (const guild of client.guilds.cache.values()) {
    const settings = await getSettings(guild)

    // Initialize counter
    if (settings.counters.length > 0) {
      await counterHandler.init(guild, settings)
    }

    // Cache invites
    if (settings.invite.tracking) {
      inviteHandler.cacheGuildInvites(guild)
    }
  }

  setInterval(
    () => counterHandler.updateCounterChannels(client),
    10 * 60 * 1000
  )
}
