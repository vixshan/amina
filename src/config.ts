// src/config.ts
import {
  ConfigCache,
  ConfigInteractions,
  ConfigFeedback,
  ConfigAutomod,
  ConfigDashboard,
  ConfigEconomy,
  ConfigMusic,
  ConfigGiveaways,
  ConfigImage,
  ConfigInvite,
  EmbedColors,
  ConfigModeration,
  ConfigStats,
  ConfigSuggestions,
  ConfigTicket,
} from './types'

export const INTERACTIONS: ConfigInteractions = {
  SLASH: true,
  CONTEXT: true,
  GLOBAL:
    process.env.GLOBAL !== undefined ? process.env.GLOBAL === 'true' : true,
}

export const CACHE_SIZE: ConfigCache = {
  GUILDS: 100,
  USERS: 10000,
  MEMBERS: 10000,
}

export const MESSAGES = {
  API_ERROR:
    'Oopsie! 🌟 Something went wrong on our end. Please try again later. If this keeps happening, reach out to our support server or run `/report`! 💖',
}

export const FEEDBACK: ConfigFeedback = {
  ENABLED: true,
  URL: process.env.LOGS_WEBHOOK,
}

export const AUTOMOD: ConfigAutomod = {
  ENABLED: true,
  LOG_EMBED: '#F1F1F1',
  DM_EMBED: '#FFB3D9',
}

export const DASHBOARD: ConfigDashboard = {
  enabled: process.env.DASH !== undefined ? process.env.DASH === 'true' : true,
  port: process.env.PORT || '8080',
}

export const ECONOMY: ConfigEconomy = {
  ENABLED: true,
  CURRENCY: '₪',
  DAILY_COINS: 100,
  MIN_BEG_AMOUNT: 100,
  MAX_BEG_AMOUNT: 2500,
}

export const MUSIC: ConfigMusic = {
  ENABLED: true,
  IDLE_TIME: 60,
  DEFAULT_VOLUME: 60,
  MAX_SEARCH_RESULTS: 5,
  DEFAULT_SOURCE: 'scsearch',
  LAVALINK_NODES: [
    {
      id: process.env.LAVALINK_ID,
      host: process.env.LAVALINK_HOST,
      port: Number(process.env.LAVALINK_PORT),
      authorization: process.env.LAVALINK_PASSWORD,
      secure: false,
      retryAmount: 20,
      retryDelay: 30000,
    },
  ],
}

export const GIVEAWAYS: ConfigGiveaways = {
  ENABLED: true,
  REACTION: '🎁',
  START_EMBED: '#FFB3D9',
  END_EMBED: '#FFB3D9',
}

export const IMAGE: ConfigImage = {
  ENABLED: true,
  BASE_API: 'https://strangeapi.hostz.me/api',
}

export const INVITE: ConfigInvite = {
  ENABLED: true,
}

export const EMBED_COLORS: EmbedColors = {
  BOT_EMBED: '#FF1493',
  SUCCESS: '#00FFB3',
  ERROR: '#FF6978',
  WARNING: '#FFD93D',
}

export const MODERATION: ConfigModeration = {
  ENABLED: true,
  EMBED_COLORS: {
    TIMEOUT: '#9B6DFF',
    UNTIMEOUT: '#4DEEEA',
    KICK: '#FF9A8C',
    SOFTBAN: '#FF75C3',
    BAN: '#FF3864',
    UNBAN: '#00F5D4',
    VMUTE: '#D4B3FF',
    VUNMUTE: '#98FB98',
    DEAFEN: '#C8A2C8',
    UNDEAFEN: '#7FFFD4',
    DISCONNECT: 'Random',
    MOVE: 'Random',
  },
}

export const STATS: ConfigStats = {
  ENABLED: true,
  XP_COOLDOWN: 5,
  DEFAULT_LVL_UP_MSG:
    '{member:tag}, Yay! 🎉 You just leveled up to **Level {level}**! 🌟',
}

export const SUGGESTIONS: ConfigSuggestions = {
  ENABLED: true,
  EMOJI: {
    UP_VOTE: '⬆️',
    DOWN_VOTE: '⬇️',
  },
  DEFAULT_EMBED: '#FFB8DE',
  APPROVED_EMBED: '#47E0A0',
  DENIED_EMBED: '#FF8BA7',
}

export const TICKET: ConfigTicket = {
  ENABLED: true,
  CREATE_EMBED: '#E0AAFF',
  CLOSE_EMBED: '#48D1CC',
}

// Export all configurations
export default {
  INTERACTIONS,
  CACHE_SIZE,
  MESSAGES,
  FEEDBACK,
  AUTOMOD,
  DASHBOARD,
  ECONOMY,
  MUSIC,
  GIVEAWAYS,
  IMAGE,
  INVITE,
  EMBED_COLORS,
  MODERATION,
  STATS,
  SUGGESTIONS,
  TICKET,
}
