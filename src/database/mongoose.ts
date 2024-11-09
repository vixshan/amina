// src/database/index.ts

import mongoose from 'mongoose'
import Logger from '../helpers/Logger'
import Giveaways from './schemas/Giveaways'
import { Guild } from './schemas/Guild'
import { Member } from './schemas/Member'
import ReactionRoles from './schemas/ReactionRoles'
import ModLog from './schemas/ModLog'
import { User } from './schemas/User'
import Suggestions from './schemas/Suggestions'
import TruthOrDare from './schemas/TruthOrDare'
import Dev from './schemas/Dev'

mongoose.set('strictQuery', true)

interface Schemas {
  Giveaways: typeof Giveaways
  Guild: typeof Guild
  Member: typeof Member
  ReactionRoles: typeof ReactionRoles.model
  ModLog: typeof ModLog.model
  User: typeof User
  Suggestions: typeof Suggestions.model
  TruthOrDare: typeof TruthOrDare.model
  Dev: typeof Dev
}

export const initializeMongoose = async (): Promise<mongoose.Connection> => {
  Logger.log(`Connecting to MongoDb...`)

  try {
    await mongoose.connect(process.env.MONGO_CONNECTION as string)

    Logger.success('Mongoose: Database connection established')

    return mongoose.connection
  } catch (err: unknown) {
    Logger.error('Mongoose: Failed to connect to database', err as Error)
    process.exit(1)
  }
}

export const schemas: Schemas = {
  Giveaways,
  Guild,
  Member,
  ReactionRoles: ReactionRoles.model,
  ModLog: ModLog.model,
  User,
  Suggestions: Suggestions.model,
  TruthOrDare: TruthOrDare.model,
  Dev,
}
