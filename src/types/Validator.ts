// types/Validator.ts
import { ApplicationCommandType, PermissionResolvable } from 'discord.js'
import CommandCategory from '@structures/CommandCategory'

export interface ValidationObject {
  callback: () => boolean | Promise<boolean>
  message: string
}

export interface SlashCommandOptions {
  enabled?: boolean
  ephemeral?: boolean
  options?: Array<any> // You might want to define a more specific type for options
}

export interface Command {
  name: string
  description: string
  cooldown?: number
  category?: keyof typeof CommandCategory
  userPermissions?: PermissionResolvable[]
  botPermissions?: PermissionResolvable[]
  validations?: ValidationObject[]
  slashCommand?: SlashCommandOptions
  interactionRun?: (...args: any[]) => Promise<any>
}

export interface BaseContext {
  name: string
  description: string
  type: ApplicationCommandType.User | ApplicationCommandType.Message
  enabled?: boolean
  ephemeral?: boolean
  defaultPermission?: boolean
  cooldown?: number
  userPermissions?: PermissionResolvable[]
}
