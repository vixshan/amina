// src/config.ts

interface LavalinkNode {
  id: string
  host: string
  port: number
  authorization: string
  secure: boolean
  retryAmount: number
  retryDelay: number
}

interface Config {
  INTERACTIONS: {
    SLASH: string
    CONTEXT: string
    GLOBAL: boolean
  }
  CACHE_SIZE: {
    GUILDS: number
    USERS: number
    MEMBERS: number
  }
  MESSAGES: {
    API_ERROR: string
  }
  FEEDBACK: {
    ENABLED: boolean
    URL: string | undefined
  }
  AUTOMOD: {
    ENABLED: boolean
    LOG_EMBED: string
    DM_EMBED: string
  }
  DASHBOARD: {
    enabled: boolean
    port: string
  }
  ECONOMY: {
    ENABLED: boolean
    CURRENCY: string
    DAILY_COINS: number
    MIN_BEG_AMOUNT: number
    MAX_BEG_AMOUNT: number
  }
  MUSIC: {
    ENABLED: boolean
    IDLE_TIME: number
    DEFAULT_VOLUME: number
    MAX_SEARCH_RESULTS: number
    DEFAULT_SOURCE: 'scsearch' | 'ytsearch' | 'ytmsearch' | 'spsearch'
    LAVALINK_NODES: LavalinkNode[]
  }
  GIVEAWAYS: {
    ENABLED: boolean
    REACTION: string
    START_EMBED: string
    END_EMBED: string
  }
  IMAGE: {
    ENABLED: boolean
    BASE_API: string
  }
  INVITE: {
    ENABLED: boolean
  }
  EMBED_COLORS: {
    BOT_EMBED: string
    SUCCESS: string
    ERROR: string
    WARNING: string
  }
  MODERATION: {
    ENABLED: boolean
    EMBED_COLORS: {
      TIMEOUT: string
      UNTIMEOUT: string
      KICK: string
      SOFTBAN: string
      BAN: string
      UNBAN: string
      VMUTE: string
      VUNMUTE: string
      DEAFEN: string
      UNDEAFEN: string
      DISCONNECT: 'RANDOM'
      MOVE: 'RANDOM'
    }
  }
  STATS: {
    ENABLED: boolean
    XP_COOLDOWN: number
    DEFAULT_LVL_UP_MSG: string
  }
  SUGGESTIONS: {
    ENABLED: boolean
    EMOJI: {
      UP_VOTE: string
      DOWN_VOTE: string
    }
    DEFAULT_EMBED: string
    APPROVED_EMBED: string
    DENIED_EMBED: string
  }
  TICKET: {
    ENABLED: boolean
    CREATE_EMBED: string
    CLOSE_EMBED: string
  }
}

const config: Config = {
  INTERACTIONS: {
    SLASH: 'true',
    CONTEXT: 'true',
    GLOBAL:
      process.env.GLOBAL !== undefined ? process.env.GLOBAL === 'true' : true,
  },

  CACHE_SIZE: {
    GUILDS: 100,
    USERS: 10000,
    MEMBERS: 10000,
  },

  MESSAGES: {
    API_ERROR:
      'Oopsie! 🌟 Something went wrong on our end. Please try again later. If this keeps happening, reach out to our support server or run `/report`! 💖',
  },

  FEEDBACK: {
    ENABLED: true,
    URL: process.env.LOGS_WEBHOOK,
  },

  AUTOMOD: {
    ENABLED: true,
    LOG_EMBED: '#F1F1F1',
    DM_EMBED: '#FFB3D9',
  },

  DASHBOARD: {
    enabled: process.env.DASHBOARD_ENABLED === 'true',
    port: process.env.PORT || '8080',
  },

  ECONOMY: {
    ENABLED: true,
    CURRENCY: '₪',
    DAILY_COINS: 100,
    MIN_BEG_AMOUNT: 100,
    MAX_BEG_AMOUNT: 2500,
  },

  MUSIC: {
    ENABLED: true,
    IDLE_TIME: 60,
    DEFAULT_VOLUME: 60,
    MAX_SEARCH_RESULTS: 5,
    DEFAULT_SOURCE: 'scsearch',
    LAVALINK_NODES: [
      {
        id: process.env.LAVALINK_ID ?? '',
        host: process.env.LAVALINK_HOST ?? '',
        port: Number(process.env.LAVALINK_PORT),
        authorization: process.env.LAVALINK_PASSWORD ?? '',
        secure: false,
        retryAmount: 20,
        retryDelay: 30000,
      },
    ],
  },

  GIVEAWAYS: {
    ENABLED: true,
    REACTION: '🎁',
    START_EMBED: '#FFB3D9',
    END_EMBED: '#FFB3D9',
  },

  IMAGE: {
    ENABLED: true,
    BASE_API: 'https://strangeapi.hostz.me/api',
  },

  INVITE: {
    ENABLED: true,
  },

  EMBED_COLORS: {
    BOT_EMBED: '#FF1493',
    SUCCESS: '#00FFB3',
    ERROR: '#FF6978',
    WARNING: '#FFD93D',
  },

  MODERATION: {
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
      DISCONNECT: 'RANDOM',
      MOVE: 'RANDOM',
    },
  },

  STATS: {
    ENABLED: true,
    XP_COOLDOWN: 5,
    DEFAULT_LVL_UP_MSG:
      '{member:tag}, Yay! 🎉 You just leveled up to **Level {level}**! 🌟',
  },

  SUGGESTIONS: {
    ENABLED: true,
    EMOJI: {
      UP_VOTE: '⬆️',
      DOWN_VOTE: '⬇️',
    },
    DEFAULT_EMBED: '#FFB8DE',
    APPROVED_EMBED: '#47E0A0',
    DENIED_EMBED: '#FF8BA7',
  },

  TICKET: {
    ENABLED: true,
    CREATE_EMBED: '#E0AAFF',
    CLOSE_EMBED: '#48D1CC',
  },
} as const

export default config
