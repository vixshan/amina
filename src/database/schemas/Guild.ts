// @root/src/database/schemas/Guild.ts

import mongoose, { Document, Model } from 'mongoose'
import { Guild } from 'discord.js'
import FixedSizeMap from 'fixedsize-map'
import { getUser } from './User'
import config from '@/config'
import { ModerationType } from '@/types/moderation'

// Type for counter configuration
interface ICounter {
  counter_type: string
  name: string
  channel_id: string
}

// Type for invite rank configuration
interface IInviteRank {
  invites: number
  _id: string
}

// Type for ticket topic configuration
interface ITicketTopic {
  name: string
}

// Type for embed configuration
interface IEmbed {
  description?: string
  color?: string
  thumbnail?: boolean
  footer?: string
  image?: string
}

// Type for welcome/farewell configuration
interface IWelcomeFarewell {
  enabled?: boolean
  channel?: string
  content?: string
  embed?: IEmbed
}

// Type for guild settings document
interface IGuildSettings extends Document {
  _id: string
  server: {
    name: string
    region: string
    owner: string
    joinedAt: Date
    leftAt?: Date
    bots: number
    updates_channel: string | null
    staff_roles: string[]
    setup_completed: boolean
    setup_message_id: string | null
    invite_link: string | null
  }
  stats: {
    enabled: boolean
    xp: {
      message: string
      channel?: string
    }
  }
  ticket: {
    log_channel?: string
    limit: number
    category: string | null
    enabled: boolean
    topics: ITicketTopic[]
    message_id?: string
  }
  automod: {
    debug?: boolean
    strikes: number
    action: string
    wh_channels: string[]
    anti_attachments?: boolean
    anti_invites?: boolean
    anti_links?: boolean
    anti_spam?: boolean
    anti_ghostping?: boolean
    anti_massmention?: number
    max_lines?: number
  }
  invite: {
    tracking: boolean
    ranks: IInviteRank[]
  }
  logs_channel?: string
  logs: {
    enabled: boolean
    member: {
      message_edit: boolean
      message_delete: boolean
      role_changes: boolean
    }
    channel: {
      create: boolean
      edit: boolean
      delete: boolean
    }
    role: {
      create: boolean
      edit: boolean
      delete: boolean
    }
  }
  max_warn: {
    action: ModerationType.TIMEOUT | ModerationType.KICK | ModerationType.BAN
    limit: number
  }
  counters: ICounter[]
  welcome: IWelcomeFarewell
  farewell: IWelcomeFarewell
  autorole?: string
  suggestions: {
    enabled?: boolean
    channel_id?: string
    approved_channel?: string
    rejected_channel?: string
  }
}

const cache = new FixedSizeMap(config.CACHE_SIZE.GUILDS)

const Schema = new mongoose.Schema<IGuildSettings>({
  _id: String,
  server: {
    name: String,
    region: String,
    owner: { type: String, ref: 'users' },
    joinedAt: Date,
    leftAt: Date,
    bots: { type: Number, default: 0 },
    updates_channel: { type: String, default: null },
    staff_roles: [String],
    setup_completed: { type: Boolean, default: false },
    setup_message_id: { type: String, default: null },
    invite_link: { type: String, default: null },
  },
  stats: {
    enabled: { type: Boolean, default: true },
    xp: {
      message: { type: String, default: config.STATS.DEFAULT_LVL_UP_MSG },
      channel: String,
    },
  },
  ticket: {
    log_channel: String,
    limit: { type: Number, default: 10 },
    category: { type: String, default: null },
    enabled: { type: Boolean, default: false },
    topics: [
      {
        _id: false,
        name: String,
      },
    ],
  },
  automod: {
    debug: Boolean,
    strikes: { type: Number, default: 10 },
    action: { type: String, default: 'TIMEOUT' },
    wh_channels: [String],
    anti_attachments: Boolean,
    anti_invites: Boolean,
    anti_links: Boolean,
    anti_spam: Boolean,
    anti_ghostping: Boolean,
    anti_massmention: Number,
    max_lines: Number,
  },
  invite: {
    tracking: { type: Boolean, default: true },
    ranks: [
      {
        invites: { type: Number, required: true },
        _id: { type: String, required: true },
      },
    ],
  },
  logs_channel: String,
  logs: {
    enabled: { type: Boolean, default: false },
    member: {
      message_edit: { type: Boolean, default: false },
      message_delete: { type: Boolean, default: false },
      role_changes: { type: Boolean, default: false },
    },
    channel: {
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    role: {
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  max_warn: {
    action: {
      type: String,
      enum: [ModerationType.TIMEOUT, ModerationType.KICK, ModerationType.BAN],
      default: ModerationType.KICK,
    },
    limit: { type: Number, default: 5 },
  },
  counters: [
    {
      _id: false,
      counter_type: String,
      name: String,
      channel_id: String,
    },
  ],
  welcome: {
    enabled: Boolean,
    channel: String,
    content: String,
    embed: {
      description: String,
      color: String,
      thumbnail: Boolean,
      footer: String,
      image: String,
    },
  },
  farewell: {
    enabled: Boolean,
    channel: String,
    content: String,
    embed: {
      description: String,
      color: String,
      thumbnail: Boolean,
      footer: String,
      image: String,
    },
  },
  autorole: String,
  suggestions: {
    enabled: Boolean,
    channel_id: String,
    approved_channel: String,
    rejected_channel: String,
  },
})

const GuildModel: Model<IGuildSettings> = mongoose.model('guild', Schema)

async function getSettings(guild: Guild): Promise<IGuildSettings> {
  if (!guild) throw new Error('Guild is undefined')
  if (!guild.id) throw new Error('Guild Id is undefined')

  const cached = cache.get(guild.id)
  if (cached) return cached as IGuildSettings

  let guildData = await GuildModel.findById(guild.id)
  if (!guildData) {
    // save owner details
    try {
      const owner = await guild.fetchOwner()
      const userDb = await getUser(owner.user)
      await userDb.save()
    } catch (ex) {
      // Handle error silently as in original
    }

    // create a new guild model
    guildData = new GuildModel({
      _id: guild.id,
      server: {
        name: guild.name,
        region: guild.preferredLocale,
        owner: guild.ownerId,
        joinedAt: guild.joinedAt,
      },
    })

    await guildData.save()
  }

  cache.add(guild.id, guildData)
  return guildData
}

async function updateSettings(
  guildId: string,
  settings: Partial<IGuildSettings>
): Promise<IGuildSettings | null> {
  if (settings.server?.staff_roles) {
    settings.server.staff_roles = Array.isArray(settings.server.staff_roles)
      ? settings.server.staff_roles
      : [settings.server.staff_roles]
  }

  // Check if a ticket message is set and update the enabled status
  if (settings.ticket?.message_id) {
    settings.ticket.enabled = true
  }

  const updatedSettings = await GuildModel.findByIdAndUpdate(
    guildId,
    settings,
    {
      new: true,
    }
  )

  if (updatedSettings) {
    cache.add(guildId, updatedSettings)
  }

  return updatedSettings
}

async function setInviteLink(
  guildId: string,
  inviteLink: string
): Promise<IGuildSettings | null> {
  const updatedSettings = await GuildModel.findByIdAndUpdate(
    guildId,
    { 'server.invite_link': inviteLink },
    { new: true }
  )

  if (updatedSettings) {
    cache.add(guildId, updatedSettings)
  }

  return updatedSettings
}

export { getSettings, updateSettings, setInviteLink, Guild }
export type {
  IGuildSettings,
  ICounter,
  IInviteRank,
  ITicketTopic,
  IEmbed,
  IWelcomeFarewell,
}
