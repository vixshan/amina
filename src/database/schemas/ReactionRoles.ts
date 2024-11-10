import { Client } from 'discord.js'
import mongoose, { Document, Schema } from 'mongoose'

// Interfaces
interface IRole {
  emote: string
  role_id: string
}

interface IReactionRole {
  guild_id: string
  channel_id: string
  message_id: string
  roles: IRole[]
  created_at: Date
}

// Extend Document for Mongoose typing
interface IReactionRoleDocument extends IReactionRole, Document {}

// Type for the cached roles
type CachedRoles = IRole[]

// Schema configuration
const reqString = {
  type: String,
  required: true,
} as const

// Define the schema with types
const reactionRoleSchema = new Schema<IReactionRoleDocument>(
  {
    guild_id: reqString,
    channel_id: reqString,
    message_id: reqString,
    roles: [
      {
        _id: false,
        emote: reqString,
        role_id: reqString,
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
)

// Create the model with proper typing
const ReactionRoleModel = mongoose.model<IReactionRoleDocument>(
  'reaction-roles',
  reactionRoleSchema
)

// Cache with proper typing
const rrCache = new Map<string, CachedRoles>()

const getKey = (
  guildId: string,
  channelId: string,
  messageId: string
): string => `${guildId}|${channelId}|${messageId}`

// Export interface for external use
export interface ReactionRoleManager {
  model: mongoose.Model<IReactionRoleDocument>
  cacheReactionRoles: (client: Client) => Promise<void>
  getReactionRoles: (
    guildId: string,
    channelId: string,
    messageId: string
  ) => CachedRoles
  addReactionRole: (
    guildId: string,
    channelId: string,
    messageId: string,
    emote: string,
    roleId: string
  ) => Promise<void>
  removeReactionRole: (
    guildId: string,
    channelId: string,
    messageId: string
  ) => Promise<void>
}

// Export the reaction role manager
export const reactionRoleManager: ReactionRoleManager = {
  model: ReactionRoleModel,

  cacheReactionRoles: async (client: Client): Promise<void> => {
    // Clear previous cache
    rrCache.clear()

    // Load all docs from database
    const docs = await ReactionRoleModel.find().lean<IReactionRole[]>()

    // Validate and cache docs
    for (const doc of docs) {
      const guild = client.guilds.cache.get(doc.guild_id)

      if (!guild) {
        // await ReactionRoleModel.deleteMany({ guild_id: doc.guild_id });
        continue
      }

      if (!guild.channels.cache.has(doc.channel_id)) {
        // await ReactionRoleModel.deleteMany({ guild_id: doc.guild_id, channel_id: doc.channel_id });
        continue
      }

      const key = getKey(doc.guild_id, doc.channel_id, doc.message_id)
      rrCache.set(key, doc.roles)
    }
  },

  getReactionRoles: (
    guildId: string,
    channelId: string,
    messageId: string
  ): CachedRoles => rrCache.get(getKey(guildId, channelId, messageId)) || [],

  addReactionRole: async (
    guildId: string,
    channelId: string,
    messageId: string,
    emote: string,
    roleId: string
  ): Promise<void> => {
    const filter = {
      guild_id: guildId,
      channel_id: channelId,
      message_id: messageId,
    }

    // Pull if existing configuration is present
    await ReactionRoleModel.updateOne(filter, { $pull: { roles: { emote } } })

    const data = await ReactionRoleModel.findOneAndUpdate(
      filter,
      {
        $push: {
          roles: { emote, role_id: roleId },
        },
      },
      { upsert: true, new: true }
    ).lean<IReactionRole>()

    if (!data) {
      throw new Error('Failed to update reaction role')
    }

    // Update cache
    const key = getKey(guildId, channelId, messageId)
    rrCache.set(key, data.roles)
  },

  removeReactionRole: async (
    guildId: string,
    channelId: string,
    messageId: string
  ): Promise<void> => {
    await ReactionRoleModel.deleteOne({
      guild_id: guildId,
      channel_id: channelId,
      message_id: messageId,
    })

    rrCache.delete(getKey(guildId, channelId, messageId))
  },
}
