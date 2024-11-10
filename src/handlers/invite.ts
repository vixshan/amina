import {
  Collection,
  Guild,
  GuildMember,
  User,
  Invite,
  APIInvite,
} from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { getMember } from '@schemas/Member'
import type { IMember, IInviteData } from '@schemas/Member'

interface InviteData {
  code: string
  uses: number
  maxUses: number
  inviterId: string
  deletedTimestamp?: number
}

interface InviteRank {
  _id: string
  invites: number
}

interface GuildSettings {
  invite: {
    tracking: boolean
    ranks: InviteRank[]
  }
}

const inviteCache = new Collection<string, Collection<string, InviteData>>()

export const getInviteCache = (
  guild: Guild
): Collection<string, InviteData> | undefined => inviteCache.get(guild.id)

export const resetInviteCache = (guild: Guild): boolean =>
  inviteCache.delete(guild.id)

export const getEffectiveInvites = (
  inviteData: Partial<IInviteData> = {}
): number =>
  (inviteData.tracked || 0) +
  (inviteData.added || 0) -
  (inviteData.fake || 0) -
  (inviteData.left || 0)

export const cacheInvite = (
  invite:
    | Invite
    | APIInvite
    | { code: string | null; uses?: number; maxUses?: number },
  isVanity = false
): InviteData => ({
  code: invite.code || 'UNKNOWN',
  uses: 'uses' in invite ? (invite.uses as number) : 0,
  maxUses: 'maxUses' in invite ? ((invite.maxUses as number) ?? 0) : 0,
  inviterId: isVanity
    ? 'VANITY'
    : 'inviter' in invite && invite.inviter
      ? invite.inviter.id
      : 'VANITY',
})

/**
 * This function caches all invites for the provided guild
 */
export async function cacheGuildInvites(
  guild: Guild
): Promise<Collection<string, InviteData>> {
  if (!guild.members.me?.permissions.has('ManageGuild')) return new Collection()
  const invites = await guild.invites.fetch()

  const tempMap = new Collection<string, InviteData>()
  invites.forEach(inv => tempMap.set(inv.code, cacheInvite(inv)))

  // Handle vanity URL code - ensure it's not null before using
  const vanityURLCode = guild.vanityURLCode
  if (vanityURLCode) {
    const vanityData = await guild.fetchVanityData()
    tempMap.set(
      vanityURLCode,
      cacheInvite(
        {
          code: vanityData.code,
          uses: vanityData.uses,
          maxUses: 0,
        },
        true
      )
    )
  }

  inviteCache.set(guild.id, tempMap)
  return tempMap
}

/**
 * Add roles to inviter based on invites count
 */
export const checkInviteRewards = async (
  guild: Guild,
  inviterData: IMember | null = null,
  isAdded: boolean
): Promise<void> => {
  const settings = await getSettings(guild)
  if (settings.invite.ranks.length > 0 && inviterData?.member_id) {
    const inviter = await guild.members
      .fetch(inviterData.member_id)
      .catch(() => undefined)
    if (!inviter) return

    const invites = getEffectiveInvites(inviterData.invite_data)
    settings.invite.ranks.forEach(reward => {
      if (isAdded) {
        if (invites >= reward.invites && !inviter.roles.cache.has(reward._id)) {
          inviter.roles.add(reward._id)
        }
      } else if (
        invites < reward.invites &&
        inviter.roles.cache.has(reward._id)
      ) {
        inviter.roles.remove(reward._id)
      }
    })
  }
}

/**
 * Track inviter by comparing new invites with cached invites
 */
export async function trackJoinedMember(
  member: GuildMember
): Promise<IMember | null> {
  const { guild } = member

  if (member.user.bot) return null

  const cachedInvites = inviteCache.get(guild.id)
  const newInvites = await cacheGuildInvites(guild)

  if (!cachedInvites) return null
  let usedInvite: InviteData | undefined

  usedInvite = newInvites.find(
    inv =>
      inv.uses !== 0 &&
      cachedInvites.get(inv.code) &&
      (cachedInvites.get(inv.code)?.uses || 0) < inv.uses
  )

  // Special case: Invitation was deleted after member's arrival
  if (!usedInvite) {
    ;[...cachedInvites.values()]
      .sort((a, b) =>
        a.deletedTimestamp && b.deletedTimestamp
          ? b.deletedTimestamp - a.deletedTimestamp
          : 0
      )
      .forEach(invite => {
        if (
          !newInvites.get(invite.code) &&
          invite.maxUses > 0 &&
          invite.uses === invite.maxUses - 1
        ) {
          usedInvite = invite
        }
      })
  }

  let inviterData: IMember | null = null
  if (usedInvite) {
    const inviterId =
      usedInvite.code === guild.vanityURLCode ? 'VANITY' : usedInvite.inviterId

    const memberDb = await getMember(guild.id, member.id)
    memberDb.invite_data.inviter = inviterId
    memberDb.invite_data.code = usedInvite.code
    await memberDb.save()

    const inviterDb = await getMember(guild.id, inviterId)
    inviterDb.invite_data.tracked += 1
    await inviterDb.save()
    inviterData = inviterDb
  }

  await checkInviteRewards(guild, inviterData, true)
  return inviterData
}

/**
 * Fetch inviter data from database
 */
export async function trackLeftMember(
  guild: Guild,
  user: User
): Promise<IMember | null> {
  if (user.bot) return null

  const settings = (await getSettings(guild)) as GuildSettings
  if (!settings.invite.tracking) return null

  const memberDb = await getMember(guild.id, user.id)
  const inviteData = memberDb.invite_data

  let inviterData: IMember | null = null
  if (inviteData.inviter) {
    const inviterId =
      inviteData.inviter === 'VANITY' ? 'VANITY' : inviteData.inviter
    const inviterDb = await getMember(guild.id, inviterId)
    inviterDb.invite_data.left += 1
    await inviterDb.save()
    inviterData = inviterDb
  }

  await checkInviteRewards(guild, inviterData, false)
  return inviterData
}

export default {
  getInviteCache,
  resetInviteCache,
  trackJoinedMember,
  trackLeftMember,
  cacheGuildInvites,
  checkInviteRewards,
  getEffectiveInvites,
  cacheInvite,
}
