import mongoose, { Document, Model, Schema } from 'mongoose'
import { User } from 'discord.js'
import config from '@/config'
import FixedSizeMap from 'fixedsize-map'

// Cache initialization
const cache = new FixedSizeMap(config.CACHE_SIZE.USERS)

// Interfaces
interface IFlag {
  reason: string
  flaggedBy: string
  flaggedAt: Date
  serverId: string
  serverName: string
}

interface IPrivacySettings {
  showAge: boolean
  showRegion: boolean
  showBirthdate: boolean
  showPronouns: boolean
}

interface IProfile {
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
  privacy: IPrivacySettings
  lastUpdated: Date
  createdAt: Date
}

interface IUserDocument extends Document {
  _id: string
  username: string
  discriminator: string
  logged: boolean
  coins: number
  bank: number
  reputation: {
    received: number
    given: number
    timestamp: Date | null
  }
  daily: {
    streak: number
    timestamp: Date | null
  }
  flags: IFlag[]
  premium: {
    enabled: boolean
    expiresAt: Date | null
  }
  afk: {
    enabled: boolean
    reason: string | null
    since: Date | null
    endTime: Date | null
  }
  profile: IProfile
  created_at: Date
  updated_at: Date
}

// Schemas
const FlagSchema = new Schema<IFlag>({
  reason: { type: String, required: true },
  flaggedBy: { type: String, required: true },
  flaggedAt: { type: Date, default: Date.now },
  serverId: { type: String, required: true },
  serverName: { type: String, required: true },
})

const ProfileSchema = new Schema<IProfile>({
  pronouns: { type: String, default: null },
  birthdate: { type: Date, default: null },
  age: { type: Number, default: null },
  region: { type: String, default: null },
  languages: [{ type: String }],
  timezone: { type: String, default: null },
  bio: { type: String, default: null, maxLength: 1000 },
  interests: [{ type: String }],
  socials: { type: Map, of: String, default: () => new Map() },
  favorites: { type: Map, of: String, default: () => new Map() },
  goals: [{ type: String }],
  privacy: {
    showAge: { type: Boolean, default: true },
    showRegion: { type: Boolean, default: true },
    showBirthdate: { type: Boolean, default: false },
    showPronouns: { type: Boolean, default: true },
  },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
})

const UserSchema = new Schema<IUserDocument>(
  {
    _id: String,
    username: String,
    discriminator: String,
    logged: { type: Boolean, default: false },
    coins: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    reputation: {
      received: { type: Number, default: 0 },
      given: { type: Number, default: 0 },
      timestamp: Date,
    },
    daily: { streak: { type: Number, default: 0 }, timestamp: Date },
    flags: { type: [FlagSchema], default: [] },
    premium: {
      enabled: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
    afk: {
      enabled: { type: Boolean, default: false },
      reason: { type: String, default: null },
      since: { type: Date, default: null },
      endTime: { type: Date, default: null },
    },
    profile: { type: ProfileSchema, default: () => ({}) },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

// Model
const UserModel: Model<IUserDocument> = mongoose.model('user', UserSchema)

// Helper Types
interface IBasicProfileData {
  pronouns?: string
  birthdate?: string | Date
  region?: string
  languages?: string[]
  timezone?: string
}

interface IMiscProfileData {
  bio?: string
  interests?: string[]
  socials?: Map<string, string>
  favorites?: Map<string, string>
  goals?: string[]
}

// Functions
export async function getUser(user: User): Promise<IUserDocument> {
  if (!user) throw new Error('User is required.')
  if (!user.id) throw new Error('User Id is required.')

  const cached = cache.get(user.id)
  if (cached) return cached as IUserDocument

  let userDb = await UserModel.findById(user.id)
  if (!userDb) {
    userDb = await UserModel.create({
      _id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      flags: [],
    })
  }

  cache.add(user.id, userDb)
  return userDb
}

export async function addFlag(
  userId: string,
  reason: string,
  flaggedBy: string,
  serverId: string,
  serverName: string
): Promise<IUserDocument | null> {
  const newFlag: IFlag = {
    reason,
    flaggedBy,
    flaggedAt: new Date(),
    serverId,
    serverName,
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $push: { flags: newFlag } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function removeFlag(
  userId: string,
  flaggedBy: string
): Promise<IUserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $pull: { flags: { flaggedBy } } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function removeAllFlags(
  userId: string
): Promise<IUserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { flags: [] } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function updatePremium(
  userId: string,
  enabled: boolean,
  expiresAt: Date | null
): Promise<IUserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { 'premium.enabled': enabled, 'premium.expiresAt': expiresAt } },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function setAfk(
  userId: string,
  reason: string | null = null,
  duration: number | null = null
): Promise<IUserDocument | null> {
  const since = new Date()
  const endTime = duration ? new Date(since.getTime() + duration * 60000) : null

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        'afk.enabled': true,
        'afk.reason': reason,
        'afk.since': since,
        'afk.endTime': endTime,
      },
    },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function removeAfk(userId: string): Promise<IUserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        'afk.enabled': false,
        'afk.reason': null,
        'afk.since': null,
        'afk.endTime': null,
      },
    },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export function calculateAge(birthdate: Date | null): number | null {
  if (!birthdate) return null
  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--
  }
  return age
}

export async function updateBasicProfile(
  userId: string,
  basicData: IBasicProfileData
): Promise<IUserDocument | null> {
  const updateData: Record<string, any> = {}

  if (basicData.pronouns !== undefined) {
    updateData['profile.pronouns'] = basicData.pronouns
  }
  if (basicData.birthdate) {
    updateData['profile.birthdate'] = new Date(basicData.birthdate)
    updateData['profile.age'] = calculateAge(new Date(basicData.birthdate))
  }
  if (basicData.region !== undefined) {
    updateData['profile.region'] = basicData.region
  }
  if (basicData.languages) {
    updateData['profile.languages'] = basicData.languages
  }
  if (basicData.timezone !== undefined) {
    updateData['profile.timezone'] = basicData.timezone
  }

  updateData['profile.lastUpdated'] = new Date()

  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: updateData },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function updateMiscProfile(
  userId: string,
  miscData: IMiscProfileData
): Promise<IUserDocument | null> {
  const updateData: Record<string, any> = {}

  if (miscData.bio !== undefined) updateData['profile.bio'] = miscData.bio
  if (miscData.interests) updateData['profile.interests'] = miscData.interests
  if (miscData.socials) updateData['profile.socials'] = miscData.socials
  if (miscData.favorites) updateData['profile.favorites'] = miscData.favorites
  if (miscData.goals) updateData['profile.goals'] = miscData.goals

  updateData['profile.lastUpdated'] = new Date()

  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: updateData },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function updateProfile(
  userId: string,
  profileData: Partial<IProfile>
): Promise<IUserDocument | null> {
  const updateData: Record<string, any> = {}

  Object.entries(profileData).forEach(([key, value]) => {
    if (value !== undefined) updateData[`profile.${key}`] = value
  })

  if (profileData.birthdate) {
    const birthDate = new Date(profileData.birthdate)
    updateData['profile.birthdate'] = birthDate
    updateData['profile.age'] = calculateAge(birthDate)
  }

  updateData['profile.lastUpdated'] = new Date()

  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: updateData },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function clearProfile(
  userId: string
): Promise<IUserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        profile: {
          pronouns: null,
          age: null,
          region: null,
          timezone: null,
          bio: null,
          birthdate: null,
          interests: [],
          customFields: [],
          privacy: {
            showAge: false,
            showRegion: false,
            showBirthdate: false,
            showPronouns: false,
          },
        },
      },
    },
    { new: true }
  )

  if (user) cache.add(userId, user)
  return user
}

export async function getUsersWithBirthdayToday(): Promise<IUserDocument[]> {
  const today = new Date()
  const users = await UserModel.find({
    'profile.birthdate': {
      $exists: true,
      $ne: null,
    },
  })

  return users.filter(user => {
    const birthdate = new Date(user.profile.birthdate!)
    return (
      birthdate.getDate() === today.getDate() &&
      birthdate.getMonth() === today.getMonth()
    )
  })
}

export { User }
