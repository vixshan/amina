import mongoose, { Document, Schema } from 'mongoose'

// Enums for better type safety
enum PresenceStatus {
  ONLINE = 'online',
  IDLE = 'idle',
  DND = 'dnd',
  INVISIBLE = 'invisible',
}

enum PresenceType {
  COMPETING = 'COMPETING',
  LISTENING = 'LISTENING',
  PLAYING = 'PLAYING',
  WATCHING = 'WATCHING',
  STREAMING = 'STREAMING',
  CUSTOM = 'CUSTOM',
}

// Interfaces
interface IPresenceConfig {
  ENABLED: boolean
  STATUS: PresenceStatus
  TYPE: PresenceType
  MESSAGE: string
  URL: string
}

interface IDevCommands {
  ENABLED: boolean
}

interface IDevConfig {
  PRESENCE: IPresenceConfig
  DEV_COMMANDS: IDevCommands
}

// Interface for the Document with timestamps
interface IDevConfigDocument extends IDevConfig, Document {
  createdAt: Date
  updatedAt: Date
}

// Schema definition with proper typing
const devConfigSchema = new Schema<IDevConfigDocument>(
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
const DevConfigModel = mongoose.model<IDevConfigDocument>(
  'dev-config',
  devConfigSchema
)

// Type for partial presence updates
type PresenceUpdateData = Partial<IPresenceConfig>

// Export interface for the manager
export interface DevConfigManager {
  Model: typeof DevConfigModel
  getPresenceConfig(): Promise<IDevConfigDocument>
  updatePresenceConfig(update: {
    PRESENCE: PresenceUpdateData
  }): Promise<IDevConfigDocument>
  getDevCommandsConfig(): Promise<IDevCommands>
  setDevCommands(enabled: boolean): Promise<IDevCommands>
}

// Export the configuration manager
export const devConfigManager: DevConfigManager = {
  Model: DevConfigModel,

  async getPresenceConfig(): Promise<IDevConfigDocument> {
    const document = await DevConfigModel.findOne()
    if (!document) {
      return await DevConfigModel.create({})
    }
    return document
  },

  async updatePresenceConfig(update: {
    PRESENCE: PresenceUpdateData
  }): Promise<IDevConfigDocument> {
    const document = await DevConfigModel.findOne()
    if (!document) {
      return await DevConfigModel.create(update)
    }

    for (const [key, value] of Object.entries(update.PRESENCE)) {
      // Type assertion here is safe because we're iterating over known keys
      ;(document.PRESENCE as any)[key as keyof IPresenceConfig] =
        value as IPresenceConfig[keyof IPresenceConfig]
    }

    return await document.save()
  },

  async getDevCommandsConfig(): Promise<IDevCommands> {
    const document = await DevConfigModel.findOne()
    if (!document) {
      return (await DevConfigModel.create({})).DEV_COMMANDS
    }
    return document.DEV_COMMANDS
  },

  async setDevCommands(enabled: boolean): Promise<IDevCommands> {
    const document = await DevConfigModel.findOne()
    if (!document) {
      return (
        await DevConfigModel.create({ DEV_COMMANDS: { ENABLED: enabled } })
      ).DEV_COMMANDS
    }

    document.DEV_COMMANDS.ENABLED = enabled
    await document.save()
    return document.DEV_COMMANDS
  },
}

// Re-export types that might be needed elsewhere
export type {
  IPresenceConfig,
  IDevCommands,
  IDevConfig,
  IDevConfigDocument,
  PresenceUpdateData,
}

// Re-export enums
export { PresenceStatus, PresenceType }
