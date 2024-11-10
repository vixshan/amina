import mongoose, { Document, Schema } from 'mongoose'

// Enums
export enum SuggestionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

// Interfaces
export interface IStatusUpdate {
  user_id: string
  status: Exclude<SuggestionStatus, SuggestionStatus.PENDING>
  reason: string
  timestamp: Date
}

export interface ISuggestion {
  guild_id: string
  channel_id: string
  message_id: string
  user_id: string
  suggestion: string
  status: SuggestionStatus
  stats: {
    upvotes: number
    downvotes: number
  }
  status_updates: IStatusUpdate[]
  created_at: Date
  updated_at: Date
}

export interface ISuggestionDocument extends ISuggestion, Document {}

// Schema
export const suggestionSchema = new Schema<ISuggestionDocument>(
  {
    guild_id: String,
    channel_id: String,
    message_id: String,
    user_id: String,
    suggestion: String,
    status: {
      type: String,
      enum: Object.values(SuggestionStatus),
      default: SuggestionStatus.PENDING,
    },
    stats: {
      upvotes: { type: Number, default: 0 },
      downvotes: { type: Number, default: 0 },
    },
    status_updates: [
      {
        _id: false,
        user_id: String,
        status: {
          type: String,
          enum: [
            SuggestionStatus.APPROVED,
            SuggestionStatus.REJECTED,
            SuggestionStatus.DELETED,
          ],
        },
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

// Create model
export const Suggestions = mongoose.model<ISuggestionDocument>(
  'suggestions',
  suggestionSchema
)

// Message interface to improve type safety
interface Message {
  guildId: string
  channelId: string
  id: string
}

// Manager interface
export interface SuggestionManager {
  model: typeof Suggestions
  addSuggestion: (
    message: Message,
    userId: string,
    suggestion: string
  ) => Promise<ISuggestionDocument>
  findSuggestion: (
    guildId: string,
    messageId: string
  ) => Promise<ISuggestionDocument | null>
  deleteSuggestionDb: (
    guildId: string,
    messageId: string,
    memberId: string,
    reason: string
  ) => Promise<mongoose.UpdateWriteOpResult>
}

// Export the suggestion manager
export const suggestionManager: SuggestionManager = {
  model: Suggestions,

  addSuggestion: async (
    message: Message,
    userId: string,
    suggestion: string
  ): Promise<ISuggestionDocument> => {
    return new Suggestions({
      guild_id: message.guildId,
      channel_id: message.channelId,
      message_id: message.id,
      user_id: userId,
      suggestion: suggestion,
    }).save()
  },

  findSuggestion: async (
    guildId: string,
    messageId: string
  ): Promise<ISuggestionDocument | null> => {
    return Suggestions.findOne({ guild_id: guildId, message_id: messageId })
  },

  deleteSuggestionDb: async (
    guildId: string,
    messageId: string,
    memberId: string,
    reason: string
  ): Promise<mongoose.UpdateWriteOpResult> => {
    return Suggestions.updateOne(
      { guild_id: guildId, message_id: messageId },
      {
        status: SuggestionStatus.DELETED,
        $push: {
          status_updates: {
            user_id: memberId,
            status: SuggestionStatus.DELETED,
            reason,
            timestamp: new Date(),
          },
        },
      }
    )
  },
}

// Export default object with all exports
export default {
  Suggestions,
  suggestionManager,
  suggestionSchema,
  SuggestionStatus,
}
