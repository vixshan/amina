// types/Guild.ts

import { Guild } from 'discord.js'
import { ModerationType } from '@src/types'

export interface GuildServer {
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

export interface XPConfig {
  message: string
  channel: string
}

export interface StatsConfig {
  enabled: boolean
  xp: XPConfig
}

export interface TicketTopic {
  name: string
}

export interface TicketConfig {
  log_channel?: string
  limit: number
  category: string | null
  enabled: boolean
  topics: TicketTopic[]
  message_id?: string // Added based on your mongoose schema usage
}

export interface AutomodConfig {
  debug?: boolean
  strikes: number
  action: ModerationType
  wh_channels: string[]
  anti_attachments?: boolean
  anti_invites?: boolean
  anti_links?: boolean
  anti_spam?: boolean
  anti_ghostping?: boolean
  anti_massmention?: number
  max_lines?: number
}

export interface InviteRank {
  invites: number
  _id: string
}

export interface InviteConfig {
  tracking: boolean
  ranks: InviteRank[]
}

export interface MemberLogConfig {
  message_edit: boolean
  message_delete: boolean
  role_changes: boolean
}

export interface EntityLogConfig {
  create: boolean
  edit: boolean
  delete: boolean
}

export interface LogConfig {
  enabled: boolean
  member: MemberLogConfig
  channel: EntityLogConfig
  role: EntityLogConfig
}

export interface Counter {
  counter_type: string
  name: string
  channel_id: string
}

export interface EmbedConfig {
  description: string
  color: string
  thumbnail: boolean
  footer: string
  image: string
}

export interface MessageConfig {
  enabled: boolean
  channel: string
  content: string
  embed: EmbedConfig
}

export interface SuggestionsConfig {
  enabled: boolean
  channel_id: string
  approved_channel: string
  rejected_channel: string
}

export interface MaxWarnConfig {
  action: ModerationType
  limit: number
}

export interface GuildSettings {
  _id: string
  server: GuildServer
  stats: StatsConfig
  ticket: TicketConfig
  automod: AutomodConfig
  invite: InviteConfig
  logs_channel?: string
  logs: LogConfig
  max_warn: MaxWarnConfig
  counters: Counter[]
  welcome: MessageConfig
  farewell: MessageConfig
  autorole?: string
  suggestions: SuggestionsConfig
}

// Utility type for partial updates
export type GuildSettingsUpdate = Partial<Omit<GuildSettings, '_id'>>

// Function type definitions
export type GetSettings = (guild: Guild) => Promise<GuildSettings>
export type UpdateSettings = (
  guildId: string,
  settings: GuildSettingsUpdate
) => Promise<GuildSettings>
export type SetInviteLink = (
  guildId: string,
  inviteLink: string
) => Promise<GuildSettings>
