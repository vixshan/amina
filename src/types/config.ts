import { ColorResolvable, EmojiIdentifierResolvable } from 'discord.js'

export interface ConfigCache {
  GUILDS: number
  USERS: number
  MEMBERS: number
}

export interface ConfigInteractions {
  SLASH: boolean
  CONTEXT: boolean
  GLOBAL: boolean
}

export interface ConfigFeedback {
  ENABLED: boolean
  URL: string | undefined
}

export interface ConfigAutomod {
  ENABLED: boolean
  LOG_EMBED: ColorResolvable
  DM_EMBED: ColorResolvable
}

export interface ConfigDashboard {
  enabled: boolean
  port: string
}

export interface ConfigEconomy {
  ENABLED: boolean
  CURRENCY: string
  DAILY_COINS: number
  MIN_BEG_AMOUNT: number
  MAX_BEG_AMOUNT: number
}

export interface LavalinkNode {
  id: string | undefined
  host: string | undefined
  port: number
  authorization: string | undefined
  secure: boolean
  retryAmount: number
  retryDelay: number
}

export interface ConfigMusic {
  ENABLED: boolean
  IDLE_TIME: number
  DEFAULT_VOLUME: number
  MAX_SEARCH_RESULTS: number
  DEFAULT_SOURCE: string
  LAVALINK_NODES: LavalinkNode[]
}

export interface ConfigGiveaways {
  ENABLED: boolean
  REACTION: EmojiIdentifierResolvable
  START_EMBED: ColorResolvable
  END_EMBED: ColorResolvable
}

export interface ConfigImage {
  ENABLED: boolean
  BASE_API: string
}

export interface ConfigInvite {
  ENABLED: boolean
}

export interface EmbedColors {
  BOT_EMBED: ColorResolvable
  SUCCESS: ColorResolvable
  ERROR: ColorResolvable
  WARNING: ColorResolvable
}

export interface ModerationEmbedColors {
  TIMEOUT: ColorResolvable
  UNTIMEOUT: ColorResolvable
  KICK: ColorResolvable
  SOFTBAN: ColorResolvable
  BAN: ColorResolvable
  UNBAN: ColorResolvable
  VMUTE: ColorResolvable
  VUNMUTE: ColorResolvable
  DEAFEN: ColorResolvable
  UNDEAFEN: ColorResolvable
  DISCONNECT: ColorResolvable
  MOVE: ColorResolvable
}

export interface ConfigModeration {
  ENABLED: boolean
  EMBED_COLORS: ModerationEmbedColors
}

export interface ConfigStats {
  ENABLED: boolean
  XP_COOLDOWN: number
  DEFAULT_LVL_UP_MSG: string
}

export interface ConfigSuggestions {
  ENABLED: boolean
  EMOJI: {
    UP_VOTE: string
    DOWN_VOTE: string
  }
  DEFAULT_EMBED: ColorResolvable
  APPROVED_EMBED: ColorResolvable
  DENIED_EMBED: ColorResolvable
}

export interface ConfigTicket {
  ENABLED: boolean
  CREATE_EMBED: ColorResolvable
  CLOSE_EMBED: ColorResolvable
}
