// Validator.ts

import { ApplicationCommandType } from 'discord.js'
import { Command, BaseContext } from '@src/types'
import CommandCategory from '@structures/CommandCategory'
import permissions from './permissions'
import config from '@src/config'
import { log, error, warn } from './Logger'

export function validateConfiguration(): void {
  log('Validating config file and environment variables')

  // Bot Token
  if (!process.env.BOT_TOKEN) {
    error('env: BOT_TOKEN cannot be empty', error)
    process.exit(1)
  }

  // Validate Database Config
  if (!process.env.MONGO_CONNECTION) {
    error('env: MONGO_CONNECTION cannot be empty', error)
    process.exit(1)
  }

  // Validate Dashboard Config
  if (config.DASHBOARD.enabled) {
    if (!process.env.CLIENT_SECRET) {
      error('env: CLIENT_SECRET cannot be empty', error)
      process.exit(1)
    }
    if (!process.env.SESSION_PASSWORD) {
      error('env: SESSION_PASSWORD cannot be empty', error)
      process.exit(1)
    }
    if (
      !process.env.BASE_URL ||
      !process.env.FAILURE_URL ||
      !config.DASHBOARD.port
    ) {
      error('config.js: DASHBOARD details cannot be empty', error)
      process.exit(1)
    }
  }

  // Validate Feedback Config
  if (config.FEEDBACK.ENABLED) {
    if (!process.env.LOGS_WEBHOOK) {
      error('env: LOGS_WEBHOOK cannot be empty when FEEDBACK is enabled', error)
      process.exit(1)
    }
  }

  // Cache Size
  if (
    isNaN(config.CACHE_SIZE.GUILDS) ||
    isNaN(config.CACHE_SIZE.USERS) ||
    isNaN(config.CACHE_SIZE.MEMBERS)
  ) {
    error('config.js: CACHE_SIZE must be a positive integer', error)
    process.exit(1)
  }

  // Music
  if (config.MUSIC.ENABLED) {
    if (config.MUSIC.LAVALINK_NODES.length === 0) {
      warn('config.js: There must be at least one node for Lavalink')
    }

    const validSources = [
      'ytsearch',
      'ytmsearch',
      'scsearch',
      'spsearch',
      'dzsearch',
      'jssearch',
    ] as const

    type ValidSource = (typeof validSources)[number]

    if (!validSources.includes(config.MUSIC.DEFAULT_SOURCE as ValidSource)) {
      warn(
        'config.js: MUSIC.DEFAULT_SOURCE must be either ytsearch, ytmsearch, scsearch, spsearch, dzsearch or jssearch'
      )
    }
  }

  // Warnings
  if (!process.env.DEV_ID || process.env.DEV_ID.length === 0) {
    warn('config.js: DEV_ID are empty')
  }
  if (!process.env.SUPPORT_SERVER) {
    warn('config.js: SUPPORT_SERVER is not provided')
  }
  if (!process.env.WEATHERSTACK_KEY) {
    warn("env: WEATHERSTACK_KEY is missing. Weather command won't work")
  }
  if (!process.env.STRANGE_API_KEY) {
    warn("env: STRANGE_API_KEY is missing. Image commands won't work")
  }
}

export function validateCommand(cmd: Command): void {
  if (typeof cmd !== 'object') {
    throw new TypeError('Command data must be an Object.')
  }
  if (typeof cmd.name !== 'string' || cmd.name !== cmd.name.toLowerCase()) {
    throw new Error('Command name must be a lowercase string.')
  }
  if (typeof cmd.description !== 'string') {
    throw new TypeError('Command description must be a string.')
  }
  if (cmd.cooldown && typeof cmd.cooldown !== 'number') {
    throw new TypeError('Command cooldown must be a number')
  }
  if (cmd.category) {
    if (!Object.prototype.hasOwnProperty.call(CommandCategory, cmd.category)) {
      throw new Error(`Not a valid category ${cmd.category}`)
    }
  }
  if (cmd.userPermissions) {
    if (!Array.isArray(cmd.userPermissions)) {
      throw new TypeError(
        'Command userPermissions must be an Array of permission key strings.'
      )
    }
    for (const perm of cmd.userPermissions) {
      if (!permissions[perm as keyof typeof permissions]) {
        throw new RangeError(`Invalid command userPermission: ${perm}`)
      }
    }
  }
  if (cmd.botPermissions) {
    if (!Array.isArray(cmd.botPermissions)) {
      throw new TypeError(
        'Command botPermissions must be an Array of permission key strings.'
      )
    }
    for (const perm of cmd.botPermissions) {
      if (!permissions[perm as keyof typeof permissions]) {
        throw new RangeError(`Invalid command botPermission: ${perm}`)
      }
    }
  }
  if (cmd.validations) {
    if (!Array.isArray(cmd.validations)) {
      throw new TypeError(
        'Command validations must be an Array of validation Objects.'
      )
    }
    for (const validation of cmd.validations) {
      if (typeof validation !== 'object') {
        throw new TypeError('Command validations must be an object.')
      }
      if (typeof validation.callback !== 'function') {
        throw new TypeError('Command validation callback must be a function.')
      }
      if (typeof validation.message !== 'string') {
        throw new TypeError('Command validation message must be a string.')
      }
    }
  }

  // Validate Slash Command Details
  if (cmd.slashCommand) {
    if (typeof cmd.slashCommand !== 'object') {
      throw new TypeError('Command.slashCommand must be an object')
    }
    if (
      Object.prototype.hasOwnProperty.call(cmd.slashCommand, 'enabled') &&
      typeof cmd.slashCommand.enabled !== 'boolean'
    ) {
      throw new TypeError(
        'Command.slashCommand enabled must be a boolean value'
      )
    }
    if (
      Object.prototype.hasOwnProperty.call(cmd.slashCommand, 'ephemeral') &&
      typeof cmd.slashCommand.ephemeral !== 'boolean'
    ) {
      throw new TypeError(
        'Command.slashCommand ephemeral must be a boolean value'
      )
    }
    if (cmd.slashCommand.options && !Array.isArray(cmd.slashCommand.options)) {
      throw new TypeError('Command.slashCommand options must be a array')
    }
    if (cmd.slashCommand.enabled && typeof cmd.interactionRun !== 'function') {
      throw new TypeError("Missing 'interactionRun' function")
    }
  }
}

export function validateContext(context: BaseContext): void {
  if (typeof context !== 'object') {
    throw new TypeError('Context must be an object')
  }
  if (
    typeof context.name !== 'string' ||
    context.name !== context.name.toLowerCase()
  ) {
    throw new Error('Context name must be a lowercase string.')
  }
  if (typeof context.description !== 'string') {
    throw new TypeError('Context description must be a string.')
  }
  if (
    context.type !== ApplicationCommandType.User &&
    context.type !== ApplicationCommandType.Message
  ) {
    throw new TypeError('Context type must be a either User/Message.')
  }
  if (
    Object.prototype.hasOwnProperty.call(context, 'enabled') &&
    typeof context.enabled !== 'boolean'
  ) {
    throw new TypeError('Context enabled must be a boolean value')
  }
  if (
    Object.prototype.hasOwnProperty.call(context, 'ephemeral') &&
    typeof context.ephemeral !== 'boolean'
  ) {
    throw new TypeError('Context enabled must be a boolean value')
  }
  if (
    Object.prototype.hasOwnProperty.call(context, 'defaultPermission') &&
    typeof context.defaultPermission !== 'boolean'
  ) {
    throw new TypeError('Context defaultPermission must be a boolean value')
  }
  if (
    Object.prototype.hasOwnProperty.call(context, 'cooldown') &&
    typeof context.cooldown !== 'number'
  ) {
    throw new TypeError('Context cooldown must be a number')
  }
  if (context.userPermissions) {
    if (!Array.isArray(context.userPermissions)) {
      throw new TypeError(
        'Context userPermissions must be an Array of permission key strings.'
      )
    }
    for (const perm of context.userPermissions) {
      if (!permissions[perm as keyof typeof permissions]) {
        throw new RangeError(`Invalid command userPermission: ${perm}`)
      }
    }
  }
}
