import mongoose from 'mongoose'

const reqString = {
  type: String,
  required: true,
}

const Schema = new mongoose.Schema(
  {
    guild_id: reqString,
    member_id: reqString,
    content: String,
    reason: String,
    strikes: Number,
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

const Model = mongoose.model('automod-logs', Schema)

interface Member {
  guild: {
    id: string
  }
  id: string
}

export const addAutoModLogToDb = async (
  member: Member,
  content: string,
  reason: string,
  strikes: number
) => {
  if (!member) throw new Error('Member is undefined')
  await new Model({
    guild_id: member.guild.id,
    member_id: member.id,
    content,
    reason,
    strikes,
  }).save()
}
