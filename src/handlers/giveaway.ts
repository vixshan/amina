import { GiveawaysManager, Giveaway, GiveawayData } from 'discord-giveaways'
import { Giveaways } from '@schemas/Giveaways'
import type { BotClient } from '@src/structures/BotClient'
import { EmojiIdentifierResolvable } from 'discord.js'

// Helper function to transform MongoDB document to GiveawayData
function transformToGiveawayData(document: any): GiveawayData {
  const {
    _id,
    __v,
    $init,
    $isDefault,
    $isDeleted,
    $session,
    $assertPopulated,
    $ignore,
    $isValid,
    $model,
    $op,
    ...giveawayData
  } = document

  // Ensure reaction is properly typed
  if (typeof giveawayData.reaction === 'string') {
    giveawayData.reaction = giveawayData.reaction as EmojiIdentifierResolvable
  }

  return giveawayData as GiveawayData
}

class MongooseGiveaways extends GiveawaysManager {
  constructor(client: BotClient) {
    super(
      client,
      {
        default: {
          botsCanWin: false,
          embedColor: client.config.GIVEAWAYS.START_EMBED,
          embedColorEnd: client.config.GIVEAWAYS.END_EMBED,
          reaction: client.config.GIVEAWAYS.REACTION,
        },
      },
      false
    )
  }

  async getAllGiveaways(): Promise<Giveaway[]> {
    const giveaways = await Giveaways.find().lean().exec()
    return giveaways.map(
      giveaway => new Giveaway(this, transformToGiveawayData(giveaway))
    )
  }

  async saveGiveaway(
    messageId: string,
    giveawayData: GiveawayData
  ): Promise<boolean> {
    await Giveaways.create(giveawayData)
    return true
  }

  async editGiveaway(
    messageId: string,
    giveawayData: Partial<GiveawayData>
  ): Promise<boolean> {
    await Giveaways.updateOne({ messageId }, giveawayData, {
      omitUndefined: true,
    }).exec()
    return true
  }

  async deleteGiveaway(messageId: string): Promise<boolean> {
    await Giveaways.deleteOne({ messageId }).exec()
    return true
  }
}

const createGiveawayManager = (client: BotClient) =>
  new MongooseGiveaways(client)

export default createGiveawayManager
