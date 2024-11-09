// voiceActions.ts

import { GuildMember, VoiceChannel, StageChannel } from 'discord.js'
import { logModeration, memberInteract } from './base'
import { error } from '@helpers/Logger'
import {
  ModerationType,
  VoiceMuteResponse,
  DeafenResponse,
  MoveResponse,
  ModBaseResponse,
} from '@/types/moderation'

export class VoiceActions {
  /**
   * Voice mutes the target and logs to the database, channel
   */
  static async vMuteTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<VoiceMuteResponse> {
    try {
      if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
      if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
      if (!target.voice.channel) return 'NO_VOICE'
      if (target.voice.mute) return 'ALREADY_MUTED'

      await target.voice.setMute(true, reason)
      await logModeration(issuer, target, reason, ModerationType.VMUTE)
      return true
    } catch (ex) {
      error('vMuteTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Voice unmutes the target and logs to the database, channel
   */
  static async vUnmuteTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<VoiceMuteResponse> {
    try {
      if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
      if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
      if (!target.voice.channel) return 'NO_VOICE'
      if (!target.voice.mute) return 'NOT_MUTED'

      await target.voice.setMute(false, reason)
      await logModeration(issuer, target, reason, ModerationType.VUNMUTE)
      return true
    } catch (ex) {
      error('vUnmuteTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Deafens the target and logs to the database, channel
   */
  static async deafenTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<DeafenResponse> {
    try {
      if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
      if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
      if (!target.voice.channel) return 'NO_VOICE'
      if (target.voice.deaf) return 'ALREADY_DEAFENED'

      await target.voice.setDeaf(true, reason)
      await logModeration(issuer, target, reason, ModerationType.DEAFEN)
      return true
    } catch (ex) {
      error('deafenTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * UnDeafens the target and logs to the database, channel
   */
  static async unDeafenTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<DeafenResponse> {
    try {
      if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
      if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
      if (!target.voice.channel) return 'NO_VOICE'
      if (!target.voice.deaf) return 'NOT_DEAFENED'

      await target.voice.setDeaf(false, reason)
      await logModeration(issuer, target, reason, ModerationType.UNDEAFEN)
      return true
    } catch (ex) {
      error('unDeafenTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Disconnects the target from voice channel and logs to the database, channel
   */
  static async disconnectTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<ModBaseResponse> {
    try {
      if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
      if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
      if (!target.voice.channel) return 'NO_VOICE'

      await target.voice.disconnect(reason)
      await logModeration(issuer, target, reason, ModerationType.DISCONNECT)
      return true
    } catch (ex) {
      error('disconnectTarget', ex)
      return 'ERROR'
    }
  }

  /**
   * Moves the target to another voice channel and logs to the database, channel
   */
  static async moveTarget(
    issuer: GuildMember,
    target: GuildMember,
    reason: string,
    channel: VoiceChannel | StageChannel
  ): Promise<MoveResponse> {
    try {
      if (!memberInteract(issuer, target)) return 'MEMBER_PERM'
      if (!memberInteract(issuer.guild.members.me!, target)) return 'BOT_PERM'
      if (!target.voice?.channel) return 'NO_VOICE'
      if (target.voice.channelId === channel.id) return 'ALREADY_IN_CHANNEL'

      const targetPerms = channel.permissionsFor(target)
      if (!targetPerms?.has(['ViewChannel', 'Connect'])) return 'TARGET_PERM'

      await target.voice.setChannel(channel, reason)
      await logModeration(issuer, target, reason, ModerationType.MOVE, {
        channel,
      })
      return true
    } catch (ex) {
      error('moveTarget', ex)
      return 'ERROR'
    }
  }
}
