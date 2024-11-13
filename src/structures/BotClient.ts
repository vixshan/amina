// src/structures/BotClient.ts
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  WebhookClient,
  ApplicationCommandType,
  ApplicationCommandDataResolvable,
  User,
  Snowflake,
  OAuth2Scopes,
  PermissionResolvable,
} from 'discord.js'

import path from 'path'
import { table } from 'table'
import Logger from '../helpers/Logger'
import { recursiveReadDirSync } from '../helpers/Utils'
import { validateCommand, validateContext } from '../helpers/Validator'
import { schemas } from '@src/database/mongoose'
import Manager from '../handlers/manager'
import giveawaysHandler from '../handlers/giveaway'
import { DiscordTogether } from 'discord-together'
import { promisify } from 'util'
import { Utils } from '../helpers/Utils'
import config from '@src/config'
import { CommandType } from './Command'
import { ContextDataType } from './BaseContext'
import CommandCategory from './CommandCategory'

const MAX_SLASH_COMMANDS = 100
const MAX_USER_CONTEXTS = 3
const MAX_MESSAGE_CONTEXTS = 3

export class BotClient extends Client {
  public config: typeof config
  public wait: (delay?: number) => Promise<void>
  public slashCommands: Collection<string, CommandType>
  public contextMenus: Collection<string, ContextDataType>
  public counterUpdateQueue: unknown[]
  public joinLeaveWebhook?: WebhookClient
  public musicManager?: Manager
  public giveawaysManager?: ReturnType<typeof giveawaysHandler>
  public logger: typeof Logger
  public database: typeof schemas
  public utils: typeof Utils
  public discordTogether: DiscordTogether<{ [key: string]: string }>

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [Partials.User, Partials.Message, Partials.Reaction],
      allowedMentions: { repliedUser: false },
      rest: {
        timeout: 20000,
      },
    })

    this.wait = (delay?: number) => promisify(setTimeout)(delay)
    this.config = config

    this.slashCommands = new Collection()
    this.contextMenus = new Collection()
    this.counterUpdateQueue = []

    this.joinLeaveWebhook = process.env.LOGS_WEBHOOK
      ? new WebhookClient({ url: process.env.LOGS_WEBHOOK })
      : undefined

    if (this.config.MUSIC.ENABLED) {
      this.musicManager = new Manager(this)
    }

    if (this.config.GIVEAWAYS.ENABLED) {
      this.giveawaysManager = giveawaysHandler(this)
    }

    this.logger = Logger
    this.database = schemas
    this.utils = Utils
    this.discordTogether = new DiscordTogether<{ [key: string]: string }>(this)
  }

  public loadEvents(directory: string): void {
    this.logger.log('Loading events...')
    const clientEvents: [string, string][] = []
    let success = 0
    let failed = 0

    recursiveReadDirSync(directory).forEach(filePath => {
      const file = path.basename(filePath)
      try {
        const eventName = path.basename(file, '.js')
        const event = require(filePath)

        this.on(eventName, event.bind(null, this))
        clientEvents.push([file, '✓'])

        delete require.cache[require.resolve(filePath)]
        success += 1
      } catch (ex) {
        failed += 1
        this.logger.error(`loadEvent - ${file}`, ex as Error)
      }
    })

    console.log(
      table(clientEvents, {
        header: { alignment: 'center', content: 'Client Events' },
        singleLine: true,
        columns: [{ width: 25 }, { width: 5, alignment: 'center' }],
      })
    )

    this.logger.log(
      `Loaded ${success + failed} events. Success (${success}) Failed (${failed})`
    )
  }

  public loadCommand(cmd: CommandType): void {
    if (cmd.category && CommandCategory[cmd.category]?.enabled === false) {
      this.logger.debug(
        `Skipping Command ${cmd.name}. Category ${cmd.category} is disabled`
      )
      return
    }

    if (cmd.slashCommand?.enabled) {
      if (this.slashCommands.has(cmd.name)) {
        throw new Error(`Slash Command ${cmd.name} already registered`)
      }

      if (cmd.testGuildOnly || cmd.devOnly) {
        this.slashCommands.set(cmd.name, cmd)
        return
      }

      if (!this.config.INTERACTIONS.GLOBAL) {
        this.logger.debug(
          `Skipping command ${cmd.name}. Command is global but GLOBAL=false`
        )
        return
      }

      this.slashCommands.set(cmd.name, cmd)
    } else {
      this.logger.debug(`Skipping slash command ${cmd.name}. Disabled!`)
    }
  }

  public loadCommands(directory: string): void {
    this.logger.log('Loading commands...')
    const files = recursiveReadDirSync(directory)
    for (const file of files) {
      try {
        const cmd = require(file)
        if (typeof cmd !== 'object') continue
        validateCommand(cmd)
        this.loadCommand(cmd)
      } catch (ex) {
        this.logger.error(
          `Failed to load ${file}`,
          new Error(`Reason: ${(ex as Error).message}`)
        )
      }
    }

    this.logger.success(`Loaded ${this.slashCommands.size} slash commands`)
    if (this.slashCommands.size > MAX_SLASH_COMMANDS) {
      throw new Error(
        `A maximum of ${MAX_SLASH_COMMANDS} slash commands can be enabled`
      )
    }
  }

  public loadContexts(directory: string): void {
    this.logger.log('Loading contexts...')
    const files = recursiveReadDirSync(directory)
    for (const file of files) {
      try {
        const ctx = require(file)
        if (typeof ctx !== 'object') continue
        validateContext(ctx)
        if (!ctx.enabled) {
          this.logger.debug(`Skipping context ${ctx.name}. Disabled!`)
          continue
        }
        if (this.contextMenus.has(ctx.name)) {
          throw new Error(`Context already exists with that name`)
        }
        this.contextMenus.set(ctx.name, ctx)
      } catch (ex) {
        this.logger.error(
          `Failed to load ${file}`,
          new Error(`Reason: ${(ex as Error).message}`)
        )
      }
    }

    const userContexts = this.contextMenus.filter(
      ctx => ctx.type === 'USER'
    ).size
    const messageContexts = this.contextMenus.filter(
      ctx => ctx.type === 'MESSAGE'
    ).size

    if (userContexts > MAX_USER_CONTEXTS) {
      throw new Error(
        `A maximum of ${MAX_USER_CONTEXTS} USER contexts can be enabled`
      )
    }
    if (messageContexts > MAX_MESSAGE_CONTEXTS) {
      throw new Error(
        `A maximum of ${MAX_MESSAGE_CONTEXTS} MESSAGE contexts can be enabled`
      )
    }

    this.logger.success(`Loaded ${userContexts} USER contexts`)
    this.logger.success(`Loaded ${messageContexts} MESSAGE contexts`)
  }

  public async registerInteractions(guildId?: Snowflake): Promise<void> {
    const toRegister: ApplicationCommandDataResolvable[] = []

    if (this.config.INTERACTIONS.SLASH) {
      this.slashCommands.forEach(cmd => {
        toRegister.push({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput as const,
          options: cmd.slashCommand.options,
        })
      })
    }

    if (this.config.INTERACTIONS.CONTEXT) {
      this.contextMenus.forEach(ctx => {
        toRegister.push({
          name: ctx.name,
          type: ctx.type as unknown as
            | ApplicationCommandType.User
            | ApplicationCommandType.Message,
        })
      })
    }

    try {
      if (!guildId) {
        await this.application?.commands.set(toRegister)
      } else {
        const guild = this.guilds.cache.get(guildId)
        if (!guild) {
          throw new Error('No matching guild')
        }
        await guild.commands.set(toRegister)
      }
      this.logger.success('Successfully registered interactions')
    } catch (error) {
      this.logger.error(
        `Failed to register interactions`,
        new Error(`Reason: ${(error as Error).message}`)
      )
    }
  }

  public async resolveUsers(search: string, exact = false): Promise<User[]> {
    if (!search || typeof search !== 'string') return []
    const users: User[] = []

    const patternMatch = search.match(/(\d{17,20})/)
    if (patternMatch) {
      const id = patternMatch[1]
      const fetched = await this.users
        .fetch(id, { cache: true })
        .catch(() => {})
      if (fetched) {
        users.push(fetched)
        return users
      }
    }

    const matchingTags = this.users.cache.filter(user => user.tag === search)
    if (exact && matchingTags.size === 1) {
      users.push(matchingTags.first()!)
    } else {
      matchingTags.forEach(match => users.push(match))
    }

    if (!exact) {
      this.users.cache
        .filter(
          x =>
            x.username === search ||
            x.username.toLowerCase().includes(search.toLowerCase()) ||
            x.tag.toLowerCase().includes(search.toLowerCase())
        )
        .forEach(user => users.push(user))
    }

    return users
  }

  public getInvite(): Promise<string> {
    return Promise.resolve(
      this.generateInvite({
        scopes: ['bot', 'applications.commands'] as OAuth2Scopes[],
        permissions: [
          'AddReactions',
          'AttachFiles',
          'BanMembers',
          'ChangeNickname',
          'Connect',
          'CreateInstantInvite',
          'DeafenMembers',
          'EmbedLinks',
          'KickMembers',
          'ManageChannels',
          'ManageGuild',
          'ManageMessages',
          'ManageNicknames',
          'ManageRoles',
          'ModerateMembers',
          'MoveMembers',
          'MuteMembers',
          'PrioritySpeaker',
          'ReadMessageHistory',
          'SendMessages',
          'SendMessagesInThreads',
          'Speak',
          'ViewChannel',
        ] as PermissionResolvable[],
      })
    )
  }
}
