import { GuildMember, User } from 'discord.js'
import { logModeration, memberInteract, ModUtils } from './base'
import { error } from '@helpers/Logger'
import { getSettings } from '@schemas/Guild'
import { getMember } from '@schemas/Member'
import { ModerationType } from '@/types/moderation'

type ModActionResult = Promise<
  true | 'MEMBER_PERM' | 'BOT_PERM' | 'ERROR' | 'ALREADY_TIMEOUT' | 'NO_TIMEOUT'
>

export class MemberActions {
  /**
   * warns the target and logs to the database, channel
   */
  public static async warnTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): ModActionResult {
    if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
    if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'

    try {
      await logModeration(issuer, target, reason, ModerationType.WARN)
      const memberDb = await getMember(issuer.guild.id, target.id)
      memberDb.warnings += 1
      const settings = await getSettings(issuer.guild)

      // check if max warnings are reached
      if (memberDb.warnings >= settings.max_warn.limit) {
        // Convert the string action to ModerationType enum
        const action = settings.max_warn.action as
          | ModerationType.TIMEOUT
          | ModerationType.KICK
          | ModerationType.SOFTBAN
          | ModerationType.BAN
        await ModUtils.addModAction(
          issuer.guild.members.me!,
          target,
          'Max warnings reached',
          action
        )
        memberDb.warnings = 0 // reset warnings
      }

      await memberDb.save()
      return true
    } catch (ex) {
      error('warnTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Timeouts(aka mutes) the target and logs to the database, channel
   */
  public static async timeoutTarget(
    issuer: GuildMember,
    target: GuildMember,
    ms: number,
    reason: string
  ): ModActionResult {
    if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
    if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
    if (
      target.communicationDisabledUntilTimestamp &&
      target.communicationDisabledUntilTimestamp - Date.now() > 0
    ) {
      return 'ALREADY_TIMEOUT'
    }

    try {
      await target.timeout(ms, reason)
      await logModeration(issuer, target, reason, ModerationType.TIMEOUT)
      return true
    } catch (ex) {
      error('timeoutTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * UnTimeouts(aka unmutes) the target and logs to the database, channel
   */
  public static async unTimeoutTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): ModActionResult {
    if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
    if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
    if (
      !target.communicationDisabledUntilTimestamp ||
      target.communicationDisabledUntilTimestamp - Date.now() < 0
    ) {
      return 'NO_TIMEOUT'
    }

    try {
      await target.timeout(null, reason)
      await logModeration(issuer, target, reason, ModerationType.UNTIMEOUT)
      return true
    } catch (ex) {
      error('unTimeoutTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * kicks the target and logs to the database, channel
   */
  public static async kickTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): ModActionResult {
    if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
    if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'

    try {
      await target.kick(reason)
      await logModeration(issuer, target, reason, ModerationType.KICK)
      return true
    } catch (ex) {
      error('kickTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Softbans the target and logs to the database, channel
   */
  public static async softbanTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): ModActionResult {
    if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
    if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'

    try {
      await target.ban({ deleteMessageDays: 7, reason })
      await issuer.guild.members.unban(target.user)
      await logModeration(issuer, target, reason, ModerationType.SOFTBAN)
      return true
    } catch (ex) {
      error('softbanTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Bans the target and logs to the database, channel
   */
  public static async banTarget(
    issuer: GuildMember,
    target: User,
    reason: string
  ): ModActionResult {
    const targetMem = await issuer.guild.members
      .fetch(target.id)
      .catch(() => null)

    if (targetMem && !memberInteract(issuer, targetMem)) return 'MEMBER_PERM'
    if (targetMem && !memberInteract(issuer.guild.members.me!, targetMem))
      return 'BOT_PERM'

    try {
      await issuer.guild.bans.create(target.id, { reason })
      await logModeration(issuer, target, reason, ModerationType.BAN)
      return true
    } catch (ex) {
      error('banTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Unbans the target and logs to the database, channel
   */
  public static async unBanTarget(
    issuer: GuildMember,
    target: User,
    reason: string
  ): ModActionResult {
    try {
      await issuer.guild.bans.remove(target, reason)
      await logModeration(issuer, target, reason, ModerationType.UNBAN)
      return true
    } catch (ex) {
      error('unBanTarget', ex)
      return 'ERROR'
    }
  }
}
