// File: src/database/schemas/Giveaways.ts
import mongoose from 'mongoose'
import {
  GiveawayData,
  LastChanceOptions,
  PauseOptions,
  MessageObject,
} from 'discord-giveaways'

// Update the messages interface to match discord-giveaways types
interface GiveawayMessages {
  giveaway: string
  giveawayEnded: string
  inviteToParticipate: string
  drawing: string
  dropMessage: string
  winMessage: string | MessageObject
  embedFooter: string | MessageObject
  noWinner: string
  winners: string
  endedAt: string
  hostedBy: string
  title: string // Add the missing title property
  timeRemaining: string // Add the missing timeRemaining property
}

// Main Giveaway interface that extends GiveawayData
export interface IGiveaway extends GiveawayData<any> {
  messageId: string
  channelId: string
  guildId: string
  startAt: number
  endAt: number
  ended: boolean
  winnerCount: number
  prize: string
  messages: GiveawayMessages
  thumbnail: string
  hostedBy: string
  winnerIds?: string[]
  reaction: string
  botsCanWin: boolean
  embedColor: string
  embedColorEnd: string
  exemptPermissions: string[]
  exemptMembers: string
  bonusEntries: string
  extraData: any
  lastChance: LastChanceOptions
  pauseOptions: PauseOptions
  isDrop: boolean
  allowedMentions: {
    parse?: string[]
    users?: string[]
    roles?: string[]
  }
}

const giveawaySchema = new mongoose.Schema<IGiveaway>(
  {
    messageId: String,
    channelId: String,
    guildId: String,
    startAt: Number,
    endAt: Number,
    ended: Boolean,
    winnerCount: Number,
    prize: String,
    messages: {
      giveaway: String,
      giveawayEnded: String,
      inviteToParticipate: String,
      drawing: String,
      dropMessage: String,
      winMessage: mongoose.Schema.Types.Mixed,
      embedFooter: mongoose.Schema.Types.Mixed,
      noWinner: String,
      winners: String,
      endedAt: String,
      hostedBy: String,
      title: String, // Add the missing title property
      timeRemaining: String, // Add the missing timeRemaining property
    },
    thumbnail: String,
    hostedBy: String,
    winnerIds: { type: [String], default: undefined },
    reaction: String,
    botsCanWin: Boolean,
    embedColor: String,
    embedColorEnd: String,
    exemptPermissions: { type: [String], default: undefined },
    exemptMembers: String,
    bonusEntries: String,
    extraData: mongoose.Schema.Types.Mixed,
    lastChance: {
      enabled: Boolean,
      content: String,
      threshold: Number,
      embedColor: String,
    },
    pauseOptions: {
      isPaused: Boolean,
      content: String,
      unPauseAfter: Number,
      embedColor: String,
      durationAfterPause: Number,
    },
    isDrop: Boolean,
    allowedMentions: {
      parse: { type: [String], default: undefined },
      users: { type: [String], default: undefined },
      roles: { type: [String], default: undefined },
    },
  },
  {
    id: false,
    autoIndex: false,
  }
)

export const model = mongoose.model<IGiveaway>('giveaways', giveawaySchema)
