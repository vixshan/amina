import {
  Message,
  EmbedBuilder,
  TextChannel,
  PermissionsBitField,
  ColorResolvable,
} from 'discord.js'
import { Utils } from '@helpers/Utils'
import { getMember } from '@schemas/Member'
import { ModUtils } from '@helpers/ModUtils'
import config from '@/config'
import { addAutoModLogToDb } from '@schemas/AutomodLogs'
import { ModerationType } from '../types/moderation'

interface AntispamInfo {
  channelId: string
  content: string
  timestamp: number
}

interface AutomodSettings {
  automod: {
    wh_channels: string[]
    debug: boolean
    max_mentions: number
    max_role_mentions: number
    anti_massmention: number
    max_lines: number
    anti_attachments: boolean
    anti_links: boolean
    anti_spam: boolean
    anti_invites: boolean
    strikes: number
    action: ModerationType
  }
  logs_channel?: string
}

interface LogField {
  name: string
  value: string
  inline: boolean
}

class AutoModHandler {
  private antispamCache: Map<string, AntispamInfo>
  private readonly MESSAGE_SPAM_THRESHOLD = 3000
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    this.antispamCache = new Map<string, AntispamInfo>()

    // Cleanup the cache
    this.cleanupInterval = setInterval(
      () => {
        this.antispamCache.forEach((value, key) => {
          if (Date.now() - value.timestamp > this.MESSAGE_SPAM_THRESHOLD) {
            this.antispamCache.delete(key)
          }
        })
      },
      10 * 60 * 1000
    )
  }

  /**
   * Check if the message needs to be moderated and has required permissions
   */
  private shouldModerate(message: Message): boolean {
    const { member, guild, channel } = message
    if (!guild || !member) return false

    // Ignore if bot cannot delete channel messages
    if (
      channel instanceof TextChannel &&
      !channel
        .permissionsFor(guild.members.me!)
        ?.has(PermissionsBitField.Flags.ManageMessages)
    )
      return false

    // Ignore Possible Guild Moderators
    if (
      member.permissions.has([
        PermissionsBitField.Flags.KickMembers,
        PermissionsBitField.Flags.BanMembers,
        PermissionsBitField.Flags.ManageGuild,
      ])
    )
      return false

    // Ignore Possible Channel Moderators
    if (
      channel instanceof TextChannel &&
      channel
        .permissionsFor(member)
        ?.has(PermissionsBitField.Flags.ManageMessages)
    )
      return false

    return true
  }

  /**
   * Perform moderation on the message
   */
  async performAutomod(
    message: Message,
    settings: AutomodSettings
  ): Promise<void> {
    const { automod } = settings

    if (automod.wh_channels.includes(message.channelId)) return
    if (!automod.debug) return
    if (!this.shouldModerate(message)) return

    const { channel, member, guild, content, author, mentions } = message
    if (!guild || !member) return

    const logChannel = settings.logs_channel
      ? (guild.channels.cache.get(settings.logs_channel) as TextChannel)
      : null

    let shouldDelete = false
    let strikesTotal = 0

    const fields: LogField[] = []

    // Max mentions
    if (mentions.members && mentions.members.size > automod.max_mentions) {
      fields.push({
        name: 'Mentions',
        value: `${mentions.members.size}/${automod.max_mentions}`,
        inline: true,
      })
      strikesTotal += 1
    }

    // Maxrole mentions
    if (mentions.roles.size > automod.max_role_mentions) {
      fields.push({
        name: 'RoleMentions',
        value: `${mentions.roles.size}/${automod.max_role_mentions}`,
        inline: true,
      })
      strikesTotal += 1
    }

    if (automod.anti_massmention > 0) {
      // check everyone mention
      if (mentions.everyone) {
        fields.push({ name: 'Everyone Mention', value: '✓', inline: true })
        strikesTotal += 1
      }

      // check user/role mentions
      if (
        mentions.users.size + mentions.roles.size >
        automod.anti_massmention
      ) {
        fields.push({
          name: 'User/Role Mentions',
          value: `${mentions.users.size + mentions.roles.size}/${automod.anti_massmention}`,
          inline: true,
        })
        strikesTotal += 1
      }
    }

    // Max Lines
    if (automod.max_lines > 0) {
      const count = content.split('\n').length
      if (count > automod.max_lines) {
        fields.push({
          name: 'New Lines',
          value: `${count}/${automod.max_lines}`,
          inline: true,
        })
        shouldDelete = true
        strikesTotal += 1
      }
    }

    // Anti Attachments
    if (automod.anti_attachments) {
      if (message.attachments.size > 0) {
        fields.push({ name: 'Attachments Found', value: '✓', inline: true })
        shouldDelete = true
        strikesTotal += 1
      }
    }

    // Anti links
    if (automod.anti_links) {
      if (Utils.containsLink(content)) {
        fields.push({ name: 'Links Found', value: '✓', inline: true })
        shouldDelete = true
        strikesTotal += 1
      }
    }

    // Anti Spam
    if (!automod.anti_links && automod.anti_spam) {
      if (Utils.containsLink(content)) {
        const key = `${author.id}|${message.guildId}`
        if (this.antispamCache.has(key)) {
          const antispamInfo = this.antispamCache.get(key)!
          if (
            antispamInfo.channelId !== message.channelId &&
            antispamInfo.content === content &&
            Date.now() - antispamInfo.timestamp < this.MESSAGE_SPAM_THRESHOLD
          ) {
            fields.push({
              name: 'AntiSpam Detection',
              value: '✓',
              inline: true,
            })
            shouldDelete = true
            strikesTotal += 1
          }
        } else {
          const antispamInfo: AntispamInfo = {
            channelId: message.channelId,
            content,
            timestamp: Date.now(),
          }
          this.antispamCache.set(key, antispamInfo)
        }
      }
    }

    // Anti Invites
    if (!automod.anti_links && automod.anti_invites) {
      if (Utils.containsDiscordInvite(content)) {
        fields.push({ name: 'Discord Invites', value: '✓', inline: true })
        shouldDelete = true
        strikesTotal += 1
      }
    }

    // delete message if deletable
    if (shouldDelete && message.deletable) {
      try {
        await message.delete()
        await (channel as TextChannel)
          .send('> Auto-Moderation! Message deleted')
          .then(msg => setTimeout(() => msg.delete(), 5000))
          .catch(() => {})
      } catch (error) {
        // Handle error silently
      }
    }

    if (strikesTotal > 0) {
      // add strikes to member
      const memberDb = await getMember(guild.id, author.id)
      memberDb.strikes += strikesTotal

      // log to db
      const reason = fields
        .map(field => `${field.name}: ${field.value}`)
        .join('\n')
      await addAutoModLogToDb(member, content, reason, strikesTotal).catch(
        () => {}
      )

      // send automod log
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setAuthor({ name: 'Auto Moderation' })
          .setThumbnail(author.displayAvatarURL())
          .setColor(config.AUTOMOD.LOG_EMBED as ColorResolvable)
          .addFields(fields)
          .setDescription(
            `**Channel:** ${channel.toString()}\n**Content:**\n${content}`
          )
          .setFooter({
            text: `By ${author.username} | ${author.id}`,
            iconURL: author.avatarURL() || undefined,
          })

        await logChannel.send({ embeds: [logEmbed] }).catch(() => {})
      }

      // DM strike details
      const strikeEmbed = new EmbedBuilder()
        .setColor(config.AUTOMOD.DM_EMBED as ColorResolvable)
        .setThumbnail(guild.iconURL() || null)
        .setAuthor({ name: 'Auto Moderation' })
        .addFields(fields)
        .setDescription(
          `You have received ${strikesTotal} strikes!\n\n` +
            `**Guild:** ${guild.name}\n` +
            `**Total Strikes:** ${memberDb.strikes} out of ${automod.strikes}`
        )

      await author.send({ embeds: [strikeEmbed] }).catch(() => {})

      // check if max strikes are received
      if (memberDb.strikes >= automod.strikes) {
        // Reset Strikes
        memberDb.strikes = 0

        // Add Moderation Action
        if (
          automod.action === ModerationType.TIMEOUT ||
          automod.action === ModerationType.KICK ||
          automod.action === ModerationType.SOFTBAN ||
          automod.action === ModerationType.BAN
        ) {
          await ModUtils.addModAction(
            guild.members.me!,
            member,
            'Automod: Max strikes received',
            automod.action
          ).catch(() => {})
        }
      }

      await memberDb.save()
    }
  }

  // Cleanup method for when the handler needs to be destroyed
  destroy() {
    clearInterval(this.cleanupInterval)
    this.antispamCache.clear()
  }
}

// Export a singleton instance
const automodHandler = new AutoModHandler()
export default automodHandler
