// new base.ts file:
import {
  EmbedBuilder,
  GuildMember,
  User,
  TextChannel,
  ColorResolvable,
} from 'discord.js'
import config from '@src/config'
import { getSettings } from '@schemas/Guild'
import ModLog from '@schemas/ModLog'
import { ModerationType, ModLogData } from '@src/types/moderation'
import { error } from '@helpers/Logger'

const DEFAULT_TIMEOUT_HOURS = 24 // hours

const memberInteract = (issuer: GuildMember, target: GuildMember): boolean => {
  const { guild } = issuer
  if (guild.ownerId === issuer.id) return true
  if (guild.ownerId === target.id) return false
  return issuer.roles.highest.position > target.roles.highest.position
}

/**
 * Send logs to the configured channel and stores in the database
 */
const logModeration = async (
  issuer: GuildMember,
  target: GuildMember | User,
  reason: string,
  type: ModerationType,
  data: ModLogData = {}
): Promise<void> => {
  if (!type) return
  const { guild } = issuer
  const settings = await getSettings(guild)

  let logChannel: TextChannel | undefined
  if (settings.logs_channel) {
    logChannel = guild.channels.cache.get(settings.logs_channel) as TextChannel
  }

  const embed = new EmbedBuilder().setFooter({
    text: `By ${issuer.displayName} • ${issuer.id}`,
    iconURL: issuer.displayAvatarURL(),
  })

  const fields: { name: string; value: string; inline?: boolean }[] = []

  switch (type) {
    case ModerationType.PURGE:
      embed.setAuthor({ name: `Moderation - ${type}` })
      fields.push(
        {
          name: 'Purge Type',
          value: data.purgeType || 'Unknown',
          inline: true,
        },
        {
          name: 'Messages',
          value: (data.deletedCount || 0).toString(),
          inline: true,
        },
        {
          name: 'Channel',
          value: data.channel
            ? `#${data.channel.name} [${data.channel.id}]`
            : 'Unknown',
          inline: false,
        }
      )
      break

    case ModerationType.TIMEOUT:
      embed.setColor(config.MODERATION.EMBED_COLORS.TIMEOUT as ColorResolvable)
      break

    case ModerationType.UNTIMEOUT:
      embed.setColor(
        config.MODERATION.EMBED_COLORS.UNTIMEOUT as ColorResolvable
      )
      break

    case ModerationType.KICK:
      embed.setColor(config.MODERATION.EMBED_COLORS.KICK as ColorResolvable)
      break

    case ModerationType.SOFTBAN:
      embed.setColor(config.MODERATION.EMBED_COLORS.SOFTBAN as ColorResolvable)
      break

    case ModerationType.BAN:
      embed.setColor(config.MODERATION.EMBED_COLORS.BAN as ColorResolvable)
      break

    case ModerationType.UNBAN:
      embed.setColor(config.MODERATION.EMBED_COLORS.UNBAN as ColorResolvable)
      break

    case ModerationType.VMUTE:
      embed.setColor(config.MODERATION.EMBED_COLORS.VMUTE as ColorResolvable)
      break

    case ModerationType.VUNMUTE:
      embed.setColor(config.MODERATION.EMBED_COLORS.VUNMUTE as ColorResolvable)
      break

    case ModerationType.DEAFEN:
      embed.setColor(config.MODERATION.EMBED_COLORS.DEAFEN as ColorResolvable)
      break

    case ModerationType.UNDEAFEN:
      embed.setColor(config.MODERATION.EMBED_COLORS.UNDEAFEN as ColorResolvable)
      break

    case ModerationType.DISCONNECT:
      embed.setColor(
        config.MODERATION.EMBED_COLORS.DISCONNECT as ColorResolvable
      )
      break

    case ModerationType.MOVE:
      embed.setColor(config.MODERATION.EMBED_COLORS.MOVE as ColorResolvable)
      break
  }

  if (type !== ModerationType.PURGE) {
    embed
      .setAuthor({ name: `Moderation - ${type}` })
      .setThumbnail(target.displayAvatarURL())

    if (target instanceof GuildMember) {
      fields.push({
        name: 'Member',
        value: `${target.displayName} [${target.id}]`,
        inline: false,
      })
    } else {
      fields.push({
        name: 'User',
        value: `${target.tag} [${target.id}]`,
        inline: false,
      })
    }

    fields.push({
      name: 'Reason',
      value: reason || 'No reason provided',
      inline: false,
    })

    if (type === ModerationType.TIMEOUT && target instanceof GuildMember) {
      fields.push({
        name: 'Expires',
        value: `<t:${Math.round(
          (target.communicationDisabledUntilTimestamp || 0) / 1000
        )}:R>`,
        inline: true,
      })
    }

    if (type === ModerationType.MOVE && data.channel) {
      fields.push({ name: 'Moved to', value: data.channel.name, inline: true })
    }
  }

  embed.setFields(fields)
  await ModLog.addModLogToDb(issuer, target, reason, type)
  if (logChannel?.send) {
    await logChannel.send({ embeds: [embed] }).catch(() => {})
  }
}

export class ModUtils {
  /**
   * Check if a member can moderate another member
   */
  static canModerate(issuer: GuildMember, target: GuildMember): boolean {
    return memberInteract(issuer, target)
  }

  /**
   * Add a moderation action
   */
  static async addModAction(
    issuer: GuildMember,
    target: GuildMember,
    reason: string,
    action:
      | ModerationType.TIMEOUT
      | ModerationType.KICK
      | ModerationType.SOFTBAN
      | ModerationType.BAN
  ): Promise<boolean> {
    switch (action) {
      case ModerationType.TIMEOUT:
        return this.timeoutTarget(
          issuer,
          target,
          DEFAULT_TIMEOUT_HOURS * 60 * 60 * 1000,
          reason
        )

      case ModerationType.KICK:
        return this.kickTarget(issuer, target, reason)

      case ModerationType.SOFTBAN:
        return this.softbanTarget(issuer, target, reason)

      case ModerationType.BAN:
        return this.banTarget(issuer, target, reason)

      default:
        return false
    }
  }

  static async timeoutTarget(
    issuer: GuildMember,
    target: GuildMember,
    ms: number,
    reason: string
  ): Promise<boolean> {
    if (!memberInteract(issuer, target)) return false
    if (!memberInteract(issuer.guild.members.me!, target)) return false
    if (
      target.communicationDisabledUntilTimestamp &&
      target.communicationDisabledUntilTimestamp - Date.now() > 0
    ) {
      return false
    }

    try {
      await target.timeout(ms, reason)
      await logModeration(issuer, target, reason, ModerationType.TIMEOUT)
      return true
    } catch (ex) {
      error('timeoutTarget', ex)
      return false
    }
  }

  static async kickTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<boolean> {
    if (!memberInteract(issuer, target)) return false
    if (!memberInteract(issuer.guild.members.me!, target)) return false

    try {
      await target.kick(reason)
      await logModeration(issuer, target, reason, ModerationType.KICK)
      return true
    } catch (ex) {
      error('kickTarget', ex)
      return false
    }
  }

  static async softbanTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<boolean> {
    if (!memberInteract(issuer, target)) return false
    if (!memberInteract(issuer.guild.members.me!, target)) return false

    try {
      await target.ban({ deleteMessageDays: 7, reason })
      await issuer.guild.members.unban(target.user)
      await logModeration(issuer, target, reason, ModerationType.SOFTBAN)
      return true
    } catch (ex) {
      error('softbanTarget', ex)
      return false
    }
  }

  static async banTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<boolean> {
    if (!memberInteract(issuer, target)) return false
    if (!memberInteract(issuer.guild.members.me!, target)) return false

    try {
      await target.ban({ reason })
      await logModeration(issuer, target, reason, ModerationType.BAN)
      return true
    } catch (ex) {
      error('banTarget', ex)
      return false
    }
  }
}

export { logModeration, memberInteract }
