import mongoose from 'mongoose'
import type { Document, Model as MongooseModel } from 'mongoose'
import type { GuildMember, User } from 'discord.js'

// Enums and Types
export enum ModerationType {
  PURGE = 'PURGE',
  WARN = 'WARN',
  TIMEOUT = 'TIMEOUT',
  UNTIMEOUT = 'UNTIMEOUT',
  KICK = 'KICK',
  SOFTBAN = 'SOFTBAN',
  BAN = 'BAN',
  UNBAN = 'UNBAN',
  VMUTE = 'VMUTE',
  VUNMUTE = 'VUNMUTE',
  DEAFEN = 'DEAFEN',
  UNDEAFEN = 'UNDEAFEN',
  DISCONNECT = 'DISCONNECT',
  MOVE = 'MOVE',
}

// Interfaces
interface IModLogAdmin {
  id: string
  tag: string
}

export interface IModLog {
  guild_id: string
  member_id: string
  reason?: string
  admin: IModLogAdmin
  type: ModerationType
  created_at?: Date
}

// Document interface for Mongoose
export interface IModLogDocument extends IModLog, Document {}

// Schema definition
const reqString = {
  type: String,
  required: true,
} as const

const ModLogSchema = new mongoose.Schema<IModLogDocument>(
  {
    guild_id: reqString,
    member_id: String,
    reason: String,
    admin: {
      id: reqString,
      tag: reqString,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ModerationType),
    },
  },
  {
    versionKey: false,
    autoIndex: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
)

// Model type with static methods
export interface ModLogModel extends MongooseModel<IModLogDocument> {
  model: any
  addModLogToDb(
    admin: GuildMember,
    target: GuildMember | User,
    reason: string | undefined,
    type: ModerationType
  ): Promise<IModLogDocument>
  getWarningLogs(guildId: string, targetId: string): Promise<IModLogDocument[]>
  clearWarningLogs(
    guildId: string,
    targetId: string
  ): Promise<mongoose.mongo.DeleteResult>
}

// Static methods
ModLogSchema.statics.addModLogToDb = async function (
  admin: GuildMember,
  target: GuildMember | User,
  reason: string | undefined,
  type: ModerationType
): Promise<IModLogDocument> {
  return new this({
    guild_id: admin.guild.id,
    member_id: target.id,
    reason,
    admin: {
      id: admin.id,
      tag: admin.user.tag,
    },
    type,
  }).save()
}

ModLogSchema.statics.getWarningLogs = async function (
  guildId: string,
  targetId: string
): Promise<IModLogDocument[]> {
  return this.find({
    guild_id: guildId,
    member_id: targetId,
    type: ModerationType.WARN,
  }).lean()
}

ModLogSchema.statics.clearWarningLogs = async function (
  guildId: string,
  targetId: string
): Promise<mongoose.mongo.DeleteResult> {
  return this.deleteMany({
    guild_id: guildId,
    member_id: targetId,
    type: ModerationType.WARN,
  })
}

// Create and export the model
const ModLog = mongoose.model<IModLogDocument, ModLogModel>(
  'mod-logs',
  ModLogSchema
)

export default ModLog
