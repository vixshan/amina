import { Client, REST } from 'discord.js'
import { COLORS } from '@src/data.json'
import { readdirSync, lstatSync } from 'fs'
import { join, extname } from 'path'
import permissions from './permissions'

/**
 * Checks if a string contains a URL
 */
export function containsLink(text: string): boolean {
  return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/.test(
    text
  )
}

/**
 * Checks if a string is a valid discord invite
 */
export function containsDiscordInvite(text: string): boolean {
  return /(https?:\/\/)?(www.)?(discord.(gg|io|me|li|link|plus)|discorda?p?p?.com\/invite|invite.gg|dsc.gg|urlcord.cf)\/[^\s/]+?(?=\b)/.test(
    text
  )
}

/**
 * Returns a random number below a max
 */
export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

/**
 * Checks if a string is a valid Hex color
 */
export function isHex(text: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(text)
}

/**
 * Checks if a string is a valid color from predefined colors
 */
export function isValidColor(text: string): boolean {
  return COLORS.includes(text)
}

/**
 * Returns hour difference between two dates
 */
export function diffHours(dt2: Date, dt1: Date): number {
  const diff = (dt2.getTime() - dt1.getTime()) / 1000
  return Math.abs(Math.round(diff / (60 * 60)))
}

/**
 * Returns remaining time in days, hours, minutes and seconds
 */
export function timeformat(timeInSeconds: number): string {
  const days = Math.floor((timeInSeconds % 31536000) / 86400)
  const hours = Math.floor((timeInSeconds % 86400) / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.round(timeInSeconds % 60)

  return [
    days > 0 && `${days} days`,
    hours > 0 && `${hours} hours`,
    minutes > 0 && `${minutes} minutes`,
    seconds > 0 && `${seconds} seconds`,
  ]
    .filter(Boolean)
    .join(', ')
}

/**
 * Converts duration to milliseconds
 */
export function durationToMillis(duration: string): number {
  return (
    duration
      .split(':')
      .map(Number)
      .reduce((acc, curr) => curr + acc * 60) * 1000
  )
}

/**
 * Returns time remaining until provided date
 */
export function getRemainingTime(timeUntil: number): string {
  const seconds = Math.abs(timeUntil / 1000)
  return timeformat(seconds)
}

/**
 * Parses permissions into readable format
 */
export function parsePermissions(perms: string[]): string {
  const permissionWord = `permission${perms.length > 1 ? 's' : ''}`
  return `\`${perms.map(perm => permissions[perm as keyof typeof permissions]).join(', ')}\` ${permissionWord}`
}

/**
 * Recursively searches for files in a directory
 */
export function recursiveReadDirSync(
  dir: string,
  allowedExtensions: string[] = ['.js']
): string[] {
  const filePaths: string[] = []

  const readCommands = (currentDir: string): void => {
    const files = readdirSync(join(process.cwd(), currentDir))
    files.forEach(file => {
      const stat = lstatSync(join(process.cwd(), currentDir, file))
      if (stat.isDirectory()) {
        readCommands(join(currentDir, file))
      } else {
        const extension = extname(file)
        if (!allowedExtensions.includes(extension)) return
        const filePath = join(process.cwd(), currentDir, file)
        filePaths.push(filePath)
      }
    })
  }

  readCommands(dir)
  return filePaths
}

/**
 * Formats milliseconds into days, hours, minutes, and seconds
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms / 1000}s`

  const units: Array<[string, number]> = [
    ['d', 864e5],
    ['h', 36e5],
    ['m', 6e4],
    ['s', 1e3],
  ]

  return (
    units
      .map(([unit, value]) => {
        const amount = Math.floor(ms / value)
        ms %= value
        return amount ? `${amount}${unit}` : null
      })
      .filter((x): x is string => x !== null)
      .join(' ') || '0s'
  )
}

/**
 * Parses a time string into milliseconds
 */
export function parseTime(string: string): number {
  const timeUnits: Record<string, number> = {
    d: 864e5,
    h: 36e5,
    m: 6e4,
    s: 1e3,
  }

  const time = string.match(/([0-9]+[dhms])/g)
  if (!time) return 0

  return time.reduce((ms, t) => {
    const unit = t[t.length - 1] as keyof typeof timeUnits
    const amount = Number(t.slice(0, -1))
    return ms + amount * timeUnits[unit]
  }, 0)
}

/**
 * Updates voice channel status
 */
export async function setVoiceStatus(
  client: Client,
  channelId: string,
  message: string
): Promise<void> {
  const url: `/${string}` = `/channels/${channelId}/voice-status`
  const payload = { status: message }
  await (client.rest as REST).put(url, { body: payload }).catch(() => {})
}

// You can also export everything as a namespace if needed
export const Utils = {
  containsLink,
  containsDiscordInvite,
  getRandomInt,
  isHex,
  isValidColor,
  diffHours,
  timeformat,
  durationToMillis,
  getRemainingTime,
  parsePermissions,
  recursiveReadDirSync,
  formatTime,
  parseTime,
  setVoiceStatus,
}
