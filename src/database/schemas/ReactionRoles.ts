import { Client } from 'discord.js'
import mongoose, { Document, Schema } from 'mongoose'

// Interfaces
export interface IRole {
  emote: string
  role_id: string
}

export interface IReactionRole {
  guild_id: string
  channel_id: string
  message_id: string
  roles: IRole[]
  created_at: Date
}

// Extend Document for Mongoose typing
export interface IReactionRoleDocument extends IReactionRole, Document {}

// Type for the cached roles
type CachedRoles = IRole[]

// Schema configuration
const reqString = {
  type: String,
  required: true,
} as const

// Define the schema with types
export const reactionRoleSchema = new Schema<IReactionRoleDocument>(
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
export const ReactionRoles = mongoose.model<IReactionRoleDocument>(
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
  model: typeof ReactionRoles
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
  model: ReactionRoles,

  cacheReactionRoles: async (client: Client): Promise<void> => {
    rrCache.clear()
    const docs = await ReactionRoles.find().lean<IReactionRole[]>()

    for (const doc of docs) {
      const guild = client.guilds.cache.get(doc.guild_id)

      if (!guild) continue
      if (!guild.channels.cache.has(doc.channel_id)) continue

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

    await ReactionRoles.updateOne(filter, { $pull: { roles: { emote } } })

    const data = await ReactionRoles.findOneAndUpdate(
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

    const key = getKey(guildId, channelId, messageId)
    rrCache.set(key, data.roles)
  },

  removeReactionRole: async (
    guildId: string,
    channelId: string,
    messageId: string
  ): Promise<void> => {
    await ReactionRoles.deleteOne({
      guild_id: guildId,
      channel_id: channelId,
      message_id: messageId,
    })

    rrCache.delete(getKey(guildId, channelId, messageId))
  },
}

// Export default object with all exports
export default {
  ReactionRoles,
  reactionRoleManager,
  reactionRoleSchema,
}
