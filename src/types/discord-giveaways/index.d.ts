// File: src/types/discord-giveaways/index.d.ts
import { Client, EmojiIdentifierResolvable } from 'discord.js'

declare module 'discord-giveaways' {
  export interface GiveawayMessages {
    giveaway?: string
    giveawayEnded?: string
    inviteToParticipate?: string
    drawing?: string
    dropMessage?: string
    winMessage?: any
    embedFooter?: any
    noWinner?: string
    winners?: string
    endedAt?: string
    hostedBy?: string
  }

  export interface GiveawayData {
    messageId: string
    channelId: string
    guildId: string
    startAt: number
    endAt: number
    ended: boolean
    winnerCount: number
    prize: string
    messages: GiveawayMessages
    thumbnail?: string
    hostedBy?: string
    winnerIds: string[]
    reaction?: EmojiIdentifierResolvable
    botsCanWin: boolean
    embedColor?: any
    embedColorEnd?: any
    exemptPermissions?: any[]
    exemptMembers?: string
    bonusEntries?: string
    extraData?: any
    lastChance?: {
      enabled: boolean
      content: string
      threshold: number
      embedColor: any
    }
    pauseOptions?: {
      isPaused: boolean
      content: string
      unPauseAfter: number
      embedColor: any
      durationAfterPause: number
    }
    isDrop?: boolean
    allowedMentions?: {
      parse?: string[]
      users?: string[]
      roles?: string[]
    }
  }

  export class Giveaway {
    constructor(manager: GiveawaysManager, data: GiveawayData)
  }

  export class GiveawaysManager {
    constructor(
      client: Client,
      options: {
        default: {
          botsCanWin: boolean
          embedColor?: any
          embedColorEnd?: any
          reaction?: any
        }
      },
      init: boolean
    )

    getAllGiveaways(): Promise<Giveaway[]>
    saveGiveaway(
      messageId: string,
      giveawayData: GiveawayData
    ): Promise<boolean>
    editGiveaway(
      messageId: string,
      giveawayData: Partial<GiveawayData>
    ): Promise<boolean>
    deleteGiveaway(messageId: string): Promise<boolean>
  }
}
