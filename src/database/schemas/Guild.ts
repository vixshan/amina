import mongoose from 'mongoose'
import { CACHE_SIZE, STATS } from '@src/config'
import FixedSizeMap from 'fixedsize-map'
import { getUser } from './User'
import { ModerationType } from '@src/types/moderation'
import type { GuildSettings, GuildSettingsUpdate } from '@src/types'
import { Guild } from 'discord.js'

// Type for the cache
const cache = new FixedSizeMap<
  string,
  mongoose.Document<unknown, {}, GuildSettings> & GuildSettings
>(CACHE_SIZE.GUILDS)

const Schema = new mongoose.Schema<GuildSettings>({
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
      message: { type: String, default: STATS.DEFAULT_LVL_UP_MSG },
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
    action: {
      type: String,
      enum: [ModerationType.TIMEOUT, ModerationType.KICK, ModerationType.BAN],
      default: ModerationType.TIMEOUT,
    },
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

const Model = mongoose.model<GuildSettings>('guild', Schema)

export async function getSettings(guild: Guild): Promise<GuildSettings> {
  if (!guild) throw new Error('Guild is undefined')
  if (!guild.id) throw new Error('Guild Id is undefined')

  const cached = cache.get(guild.id)
  if (cached) return cached

  let guildData = await Model.findById(guild.id)
  if (!guildData) {
    // save owner details
    guild
      .fetchOwner()
      .then(async owner => {
        const userDb = await getUser(owner)
        await userDb.save()
      })
      .catch(ex => {})

    // create a new guild model
    guildData = new Model({
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

export async function updateSettings(
  guildId: string,
  settings: GuildSettingsUpdate
): Promise<GuildSettings> {
  if (settings.server?.staff_roles) {
    settings.server.staff_roles = Array.isArray(settings.server.staff_roles)
      ? settings.server.staff_roles
      : [settings.server.staff_roles]
  }

  // Check if a ticket message is set and update the enabled status
  if (settings.ticket?.message_id) {
    settings.ticket.enabled = true
  }

  const updatedSettings = await Model.findByIdAndUpdate(guildId, settings, {
    new: true,
  })

  if (!updatedSettings) {
    throw new Error(`Could not find guild with id ${guildId}`)
  }

  cache.add(guildId, updatedSettings)
  return updatedSettings
}

export async function setInviteLink(
  guildId: string,
  inviteLink: string
): Promise<GuildSettings> {
  const updatedSettings = await Model.findByIdAndUpdate(
    guildId,
    { 'server.invite_link': inviteLink },
    { new: true }
  )

  if (!updatedSettings) {
    throw new Error(`Could not find guild with id ${guildId}`)
  }

  cache.add(guildId, updatedSettings)
  return updatedSettings
}

export default {
  getSettings,
  updateSettings,
  setInviteLink,
}
