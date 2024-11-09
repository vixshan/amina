import {
  Collection,
  GuildMember,
  BaseGuildTextChannel,
  Message,
} from 'discord.js'
import { Utils } from '@helpers/Utils'
import { error } from '@helpers/Logger'
import { logModeration } from './base'
import { ModerationType, PurgeType, PurgeResponse } from '@/types/moderation'

export class MessageActions {
  static async purgeMessages(
    issuer: GuildMember,
    channel: BaseGuildTextChannel,
    type: PurgeType,
    amount: number,
    argument?: string
  ): Promise<PurgeResponse> {
    if (
      !channel
        .permissionsFor(issuer)
        ?.has(['ManageMessages', 'ReadMessageHistory'])
    ) {
      return 'MEMBER_PERM'
    }

    const me = issuer.guild.members.me
    if (
      !me ||
      !channel.permissionsFor(me)?.has(['ManageMessages', 'ReadMessageHistory'])
    ) {
      return 'BOT_PERM'
    }

    if (amount <= 0 || amount > 500) {
      return 'INVALID_AMOUNT'
    }

    const toDelete = new Collection<string, Message>()

    try {
      let messages: Collection<string, Message>

      const fetchOptions = {
        cache: false,
        force: true,
        limit: type === 'ALL' ? amount : undefined,
      }

      switch (type) {
        case 'ALL':
          messages = await channel.messages.fetch(fetchOptions)
          break

        case 'BOT': {
          messages = await channel.messages.fetch(fetchOptions)
          messages = new Collection(
            Array.from(messages.entries())
              .filter(([_, message]) => message.author.bot)
              .slice(0, amount)
          )
          break
        }

        case 'LINK': {
          messages = await channel.messages.fetch(fetchOptions)
          messages = new Collection(
            Array.from(messages.entries())
              .filter(([_, message]) => Utils.containsLink(message.content))
              .slice(0, amount)
          )
          break
        }

        case 'TOKEN': {
          if (!argument) return 'INVALID_AMOUNT'
          messages = await channel.messages.fetch(fetchOptions)
          messages = new Collection(
            Array.from(messages.entries())
              .filter(([_, message]) => message.content.includes(argument))
              .slice(0, amount)
          )
          break
        }

        case 'ATTACHMENT': {
          messages = await channel.messages.fetch(fetchOptions)
          messages = new Collection(
            Array.from(messages.entries())
              .filter(([_, message]) => message.attachments.size > 0)
              .slice(0, amount)
          )
          break
        }

        case 'USER': {
          if (!argument) return 'INVALID_AMOUNT'
          messages = await channel.messages.fetch(fetchOptions)
          messages = new Collection(
            Array.from(messages.entries())
              .filter(([_, message]) => message.author.id === argument)
              .slice(0, amount)
          )
          break
        }
      }

      // Filter messages within 14 days and are deletable
      const twoWeeksAgo = Date.now() - 1209600000
      for (const [id, message] of messages) {
        if (toDelete.size >= amount) break
        if (!message.deletable) continue
        if (message.createdTimestamp < twoWeeksAgo) continue

        switch (type) {
          case 'ALL':
            toDelete.set(id, message)
            break
          case 'ATTACHMENT':
            if (message.attachments.size > 0) {
              toDelete.set(id, message)
            }
            break
          case 'BOT':
            if (message.author.bot) {
              toDelete.set(id, message)
            }
            break
          case 'LINK':
            if (Utils.containsLink(message.content)) {
              toDelete.set(id, message)
            }
            break
          case 'TOKEN':
            if (argument && message.content.includes(argument)) {
              toDelete.set(id, message)
            }
            break
          case 'USER':
            if (argument && message.author.id === argument) {
              toDelete.set(id, message)
            }
            break
        }
      }

      if (toDelete.size === 0) return 'NO_MESSAGES'

      const firstMessage = toDelete.first()
      if (toDelete.size === 1 && firstMessage?.author.id === issuer.id) {
        await firstMessage.delete()
        return 'NO_MESSAGES'
      }

      const deletedMessages = await channel.bulkDelete(toDelete, true)

      await logModeration(
        issuer,
        issuer,
        'Message purge',
        ModerationType.PURGE,
        {
          purgeType: type,
          channel: channel,
          deletedCount: deletedMessages.size,
        }
      )

      return deletedMessages.size
    } catch (ex) {
      error('purgeMessages', ex)
      return 'ERROR'
    }
  }
}
