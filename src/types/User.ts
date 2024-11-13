// types/User.ts
import { Document } from 'mongoose'
import { GuildMember, User } from 'discord.js'

export interface UserFlag {
  reason: string
  flaggedBy: string
  flaggedAt: Date
  serverId: string
  serverName: string
}

export interface UserReputation {
  received: number
  given: number
  timestamp?: Date
}

export interface UserDaily {
  streak: number
  timestamp?: Date
}

export interface UserPremium {
  enabled: boolean
  expiresAt: Date | null
}

export interface UserAfk {
  enabled: boolean
  reason: string | null
  since: Date | null
  endTime: Date | null
}

export interface ProfilePrivacy {
  showAge: boolean
  showRegion: boolean
  showBirthdate: boolean
  showPronouns: boolean
}

export interface UserProfile {
  pronouns: string | null
  birthdate: Date | null
  age: number | null
  region: string | null
  languages: string[]
  timezone: string | null
  bio: string | null
  interests: string[]
  socials: Map<string, string>
  favorites: Map<string, string>
  goals: string[]
  privacy: ProfilePrivacy
  lastUpdated: Date
  createdAt: Date
}

export interface UserSettings extends Document {
  _id: string
  username: string
  discriminator: string
  logged: boolean
  coins: number
  bank: number
  reputation: UserReputation
  daily: UserDaily
  flags: UserFlag[]
  premium: UserPremium
  afk: UserAfk
  profile: UserProfile
  created_at?: Date
  updated_at?: Date
}

export interface BasicProfileData {
  pronouns?: string | null
  birthdate?: string | Date
  region?: string | null
  languages?: string[]
  timezone?: string | null
}

export interface MiscProfileData {
  bio?: string | null
  interests?: string[]
  socials?: Map<string, string>
  favorites?: Map<string, string>
  goals?: string[]
}

export type ProfileData = Partial<
  Omit<UserProfile, 'lastUpdated' | 'createdAt'>
>

// Function types
export type GetUser = (user: User | GuildMember) => Promise<UserSettings>
export type AddFlag = (
  userId: string,
  reason: string,
  flaggedBy: string,
  serverId: string,
  serverName: string
) => Promise<UserSettings>
export type RemoveFlag = (
  userId: string,
  flaggedBy: string
) => Promise<UserSettings>
export type RemoveAllFlags = (userId: string) => Promise<UserSettings>
export type UpdatePremium = (
  userId: string,
  enabled: boolean,
  expiresAt: Date | null
) => Promise<UserSettings>
export type SetAfk = (
  userId: string,
  reason?: string | null,
  duration?: number | null
) => Promise<UserSettings>
export type RemoveAfk = (userId: string) => Promise<UserSettings>
export type UpdateBasicProfile = (
  userId: string,
  basicData: BasicProfileData
) => Promise<UserSettings>
export type UpdateMiscProfile = (
  userId: string,
  miscData: MiscProfileData
) => Promise<UserSettings>
export type UpdateProfile = (
  userId: string,
  profileData: ProfileData
) => Promise<UserSettings>
export type ClearProfile = (userId: string) => Promise<UserSettings>
export type GetUsersWithBirthdayToday = () => Promise<UserSettings[]>
