// mongoose.ts
import mongoose from 'mongoose'
import Logger from '../helpers/Logger'

// Import schemas using ES modules
import { Giveaways } from './schemas/Giveaways'
import { Guild } from './schemas/Guild'
import { Member } from './schemas/Member'
import { ReactionRoles } from './schemas/ReactionRoles'
import ModLog from './schemas/ModLog'
import { User } from './schemas/User'
import { Suggestions } from './schemas/Suggestions'
import { TruthOrDare } from './schemas/TruthOrDare'
import { Dev } from './schemas/Dev'

// Set mongoose options
mongoose.set('strictQuery', true)

// Define the schemas interface
export interface MongooseSchemas {
  Giveaways: typeof Giveaways
  Guild: typeof Guild
  Member: typeof Member
  ReactionRoles: typeof ReactionRoles
  ModLog: typeof ModLog
  User: typeof User
  Suggestions: typeof Suggestions
  TruthOrDare: typeof TruthOrDare
  Dev: typeof Dev
}

// Export the schemas object
export const schemas: MongooseSchemas = {
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

// Export the initialize function
export async function initializeMongoose(): Promise<mongoose.Connection> {
  Logger.log(`Connecting to MongoDb...`)

  try {
    const mongoConnection = process.env.MONGO_CONNECTION
    if (!mongoConnection) {
      throw new Error('MONGO_CONNECTION environment variable is not defined')
    }

    await mongoose.connect(mongoConnection)
    Logger.success('Mongoose: Database connection established')

    return mongoose.connection
  } catch (err) {
    Logger.error('Mongoose: Failed to connect to database', err as Error)
    process.exit(1)
  }
}

// Export all required items
export {
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

// Export default object with all exports
export default {
  initializeMongoose,
  schemas,
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
