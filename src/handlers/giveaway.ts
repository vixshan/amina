// src/handlers/giveaway.ts
import { GiveawaysManager, Giveaway } from 'discord-giveaways'
import { Giveaways } from '@schemas/Giveaways'
import type { BotClient } from '@src/structures/BotClient'

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
      false // do not initialize manager yet
    )
  }

  async getAllGiveaways(): Promise<Giveaway[]> {
    const giveaways = await Giveaways.find().lean().exec()
    return giveaways.map(giveaway => new Giveaway(this, giveaway))
  }

  async saveGiveaway(messageId: string, giveawayData: any) {
    await Giveaways.create(giveawayData)
    return true
  }

  async editGiveaway(messageId: string, giveawayData: any) {
    await Giveaways.updateOne({ messageId }, giveawayData, {
      omitUndefined: true,
    }).exec()
    return true
  }

  async deleteGiveaway(messageId: string) {
    await Giveaways.deleteOne({ messageId }).exec()
    return true
  }
}

const createGiveawayManager = (client: BotClient) =>
  new MongooseGiveaways(client)

export default createGiveawayManager
