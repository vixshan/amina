import mongoose from 'mongoose'
import { log, success, error } from '../helpers/Logger'
import { Giveaways } from './schemas/Giveaways'
import Guild from './schemas/Guild'
import { Member } from './schemas/Member'
import { ReactionRoles } from './schemas/ReactionRoles'
import ModLog from './schemas/ModLog'
import User from './schemas/User'
import Suggestions from './schemas/Suggestions'
import TruthOrDare from './schemas/TruthOrDare'
import Dev from './schemas/Dev'

mongoose.set('strictQuery', true)

export async function initializeMongoose() {
  log('Connecting to MongoDb...')

  try {
    await mongoose.connect(process.env.MONGO_CONNECTION)

    success('Mongoose: Database connection established')

    return mongoose.connection
  } catch (err) {
    error('Mongoose: Failed to connect to database', err)
    process.exit(1)
  }
}

export const schemas = {
  Giveaways,
  Guild,
  Member,
  ReactionRoles,
  ModLog,
  User,
  Suggestions,
  TruthOrDare,
  Dev,
}
