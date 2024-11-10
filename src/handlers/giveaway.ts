// File: src/handlers/giveaway.ts
import {
  GiveawaysManager,
  GiveawaysManagerOptions,
  Giveaway,
} from 'discord-giveaways'
import { ColorResolvable } from 'discord.js'
import { model as Model, IGiveaway } from '@schemas/Giveaways'
import { BotClient } from '@structures/BotClient'

class MongooseGiveaways extends GiveawaysManager {
  private client: BotClient

  constructor(client: BotClient) {
    const options: GiveawaysManagerOptions = {
      default: {
        botsCanWin: false,
        embedColor: client.config.GIVEAWAYS.START_EMBED as ColorResolvable,
        embedColorEnd: client.config.GIVEAWAYS.END_EMBED as ColorResolvable,
        reaction: client.config.GIVEAWAYS.REACTION,
      },
    }

    super(client, options, false)
    this.client = client
  }

  // Convert IGiveaway to Giveaway
  private convertToGiveaway(giveawayData: IGiveaway): Giveaway<any> {
    return new Giveaway<any>(this, {
      ...giveawayData,
      messages: {
        ...giveawayData.messages,
        winMessage: giveawayData.messages.winMessage as string | MessageObject,
        embedFooter: giveawayData.messages.embedFooter as
          | string
          | MessageObject,
      },
    })
  }

  async getAllGiveaways(): Promise<Giveaway<any>[]> {
    const giveaways = await Model.find().lean().exec()
    return giveaways.map(giveaway => this.convertToGiveaway(giveaway))
  }

  async saveGiveaway(
    messageId: string,
    giveawayData: GiveawayData<any>
  ): Promise<boolean> {
    await Model.create({
      ...giveawayData,
      messageId,
      botsCanWin: giveawayData.botsCanWin ?? false,
    })
    return true
  }

  async editGiveaway(
    messageId: string,
    giveawayData: GiveawayData<any>
  ): Promise<boolean> {
    await Model.updateOne({ messageId }, giveawayData, {
      omitUndefined: true,
    }).exec()
    return true
  }

  async deleteGiveaway(messageId: string): Promise<boolean> {
    await Model.deleteOne({ messageId }).exec()
    return true
  }
}

// Factory function to create new manager instance
export default (client: BotClient): MongooseGiveaways =>
  new MongooseGiveaways(client)
