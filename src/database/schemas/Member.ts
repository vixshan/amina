import mongoose, { Document, Model } from 'mongoose'
import config from '@/config'
import FixedSizeMap from 'fixedsize-map'

const cache = new FixedSizeMap(config.CACHE_SIZE.MEMBERS)

// Type for invite data
interface IInviteData {
  inviter?: string
  code?: string
  tracked: number
  fake: number
  left: number
  added: number
}

// Interface for Member document
interface IMember extends Document {
  guild_id: string
  member_id: string
  strikes: number
  warnings: number
  invite_data: IInviteData
  created_at: Date
  updated_at: Date
}

// Interface for leaderboard aggregation result
interface IInviteLeaderboard {
  member_id: string
  invites: number
}

const ReqString = {
  type: String,
  required: true,
} as const

const Schema = new mongoose.Schema<IMember>(
  {
    guild_id: ReqString,
    member_id: ReqString,
    strikes: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    invite_data: {
      inviter: String,
      code: String,
      tracked: { type: Number, default: 0 },
      fake: { type: Number, default: 0 },
      left: { type: Number, default: 0 },
      added: { type: Number, default: 0 },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

const MemberModel: Model<IMember> = mongoose.model('members', Schema)

/**
 * Get a member from the database
 * @param guildId The guild ID
 * @param memberId The member ID
 * @returns Promise<IMember>
 */
const getMember = async (
  guildId: string,
  memberId: string
): Promise<IMember> => {
  const key = `${guildId}|${memberId}`
  if (cache.contains(key)) return cache.get(key) as IMember

  let member = await MemberModel.findOne({
    guild_id: guildId,
    member_id: memberId,
  })
  if (!member) {
    member = new MemberModel({
      guild_id: guildId,
      member_id: memberId,
    })
  }

  cache.add(key, member)
  return member
}

/**
 * Get the invites leaderboard for a guild
 * @param guildId The guild ID
 * @param limit The maximum number of entries to return
 * @returns Promise<IInviteLeaderboard[]>
 */
const getInvitesLb = async (
  guildId: string,
  limit = 10
): Promise<IInviteLeaderboard[]> => {
  return MemberModel.aggregate<IInviteLeaderboard>([
    { $match: { guild_id: guildId } },
    {
      $project: {
        member_id: '$member_id',
        invites: {
          $subtract: [
            { $add: ['$invite_data.tracked', '$invite_data.added'] },
            { $add: ['$invite_data.left', '$invite_data.fake'] },
          ],
        },
      },
    },
    { $match: { invites: { $gt: 0 } } },
    { $sort: { invites: -1 } },
    { $limit: limit },
  ])
}

export { MemberModel as Member, getMember, getInvitesLb }
export type { IMember, IInviteData, IInviteLeaderboard }
