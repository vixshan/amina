import mongoose, { Document, Schema } from 'mongoose'

// Enums for better type safety
export enum PresenceStatus {
  ONLINE = 'online',
  IDLE = 'idle',
  DND = 'dnd',
  INVISIBLE = 'invisible',
}

export enum PresenceType {
  COMPETING = 'COMPETING',
  LISTENING = 'LISTENING',
  PLAYING = 'PLAYING',
  WATCHING = 'WATCHING',
  STREAMING = 'STREAMING',
  CUSTOM = 'CUSTOM',
}

// Interfaces
export interface IPresenceConfig {
  ENABLED: boolean
  STATUS: PresenceStatus
  TYPE: PresenceType
  MESSAGE: string
  URL: string
}

export interface IDevCommands {
  ENABLED: boolean
}

export interface IDevConfig {
  PRESENCE: IPresenceConfig
  DEV_COMMANDS: IDevCommands
}

// Interface for the Document with timestamps
export interface IDevConfigDocument extends IDevConfig, Document {
  createdAt: Date
  updatedAt: Date
}

// Type for partial presence updates
export type PresenceUpdateData = Partial<IPresenceConfig>

// Schema definition with proper typing
export const devConfigSchema = new Schema<IDevConfigDocument>(
  {
    PRESENCE: {
      ENABLED: {
        type: Boolean,
        default: true,
      },
      STATUS: {
        type: String,
        enum: Object.values(PresenceStatus),
        default: PresenceStatus.IDLE,
      },
      TYPE: {
        type: String,
        enum: Object.values(PresenceType),
        default: PresenceType.CUSTOM,
      },
      MESSAGE: {
        type: String,
        default: "We'll show them. We'll show them all...",
      },
      URL: {
        type: String,
        default: 'https://twitch.tv/iamvikshan',
      },
    },
    DEV_COMMANDS: {
      ENABLED: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Create the model with proper typing
export const Dev = mongoose.model<IDevConfigDocument>(
  'dev-config',
  devConfigSchema
)

// Export interface for the manager
export interface DevConfigManager {
  model: typeof Dev
  getPresenceConfig(): Promise<IDevConfigDocument>
  updatePresenceConfig(update: {
    PRESENCE: PresenceUpdateData
  }): Promise<IDevConfigDocument>
  getDevCommandsConfig(): Promise<IDevCommands>
  setDevCommands(enabled: boolean): Promise<IDevCommands>
}

// Export the configuration manager
export const devConfigManager: DevConfigManager = {
  model: Dev,

  async getPresenceConfig(): Promise<IDevConfigDocument> {
    const document = await Dev.findOne()
    if (!document) {
      return await Dev.create({})
    }
    return document
  },

  async updatePresenceConfig(update: {
    PRESENCE: PresenceUpdateData
  }): Promise<IDevConfigDocument> {
    const document = await Dev.findOne()
    if (!document) {
      return await Dev.create(update)
    }

    for (const [key, value] of Object.entries(update.PRESENCE)) {
      // Type assertion here is safe because we're iterating over known keys
      ;(document.PRESENCE as any)[key as keyof IPresenceConfig] =
        value as IPresenceConfig[keyof IPresenceConfig]
    }

    return await document.save()
  },

  async getDevCommandsConfig(): Promise<IDevCommands> {
    const document = await Dev.findOne()
    if (!document) {
      return (await Dev.create({})).DEV_COMMANDS
    }
    return document.DEV_COMMANDS
  },

  async setDevCommands(enabled: boolean): Promise<IDevCommands> {
    const document = await Dev.findOne()
    if (!document) {
      return (await Dev.create({ DEV_COMMANDS: { ENABLED: enabled } }))
        .DEV_COMMANDS
    }

    document.DEV_COMMANDS.ENABLED = enabled
    await document.save()
    return document.DEV_COMMANDS
  },
}

// Export default object with all exports
export default {
  Dev,
  devConfigManager,
  devConfigSchema,
  PresenceStatus,
  PresenceType,
}
