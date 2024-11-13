import { getJson } from '@helpers/HttpUtils'
import { success, warn, error } from '@helpers/Logger'
import { Message } from 'discord.js'

/**
 * Check if the bot is up to date
 */
export async function checkForUpdates(): Promise<void> {
  try {
    const response = await getJson(
      'https://api.github.com/repos/saiteja-madha/discord-js-bot/releases/latest',
      {}
    )
    if (!response.success) {
      error('VersionCheck: Failed to check for bot updates', error)
      return
    }
    if (response.data) {
      const currentVersion = require('@/package.json').version.replace(
        /[^0-9]/g,
        ''
      )
      const latestVersion = response.data.tag_name.replace(/[^0-9]/g, '')
      if (currentVersion >= latestVersion) {
        success('VersionCheck: Your discord bot is up to date')
      } else {
        warn(`VersionCheck: ${response.data.tag_name} update is available`)
        warn(
          'download: https://github.com/saiteja-madha/discord-js-bot/releases/latest'
        )
      }
    }
  } catch (err) {
    error('VersionCheck: An error occurred while checking for updates', err)
  }
}

/**
 * Get the image url from the message
 * @param {Message} message
 * @param {string[]} args
 */
export async function getImageFromMessage(
  message: Message,
  args: string[]
): Promise<string> {
  let url: string | undefined

  // check for attachments
  if (message.attachments.size > 0) {
    const attachment = message.attachments.first()
    const attachUrl = attachment?.url
    const attachIsImage =
      attachUrl?.endsWith('.png') ||
      attachUrl?.endsWith('.jpg') ||
      attachUrl?.endsWith('.jpeg')
    if (attachIsImage) url = attachUrl
  }

  if (!url && args.length === 0) {
    url = message.author.displayAvatarURL({ size: 256, extension: 'png' })
  }

  if (!url && args.length !== 0) {
    try {
      url = new URL(args[0]).href
    } catch (ex) {
      /* Ignore */
    }
  }

  if (!url && message.mentions.users.size > 0) {
    url = message.mentions.users
      .first()
      ?.displayAvatarURL({ size: 256, extension: 'png' })
  }

  if (!url) {
    const member = await message.guild?.members.fetch(args[0])
    if (member) {
      url = member.user.displayAvatarURL({ size: 256, extension: 'png' })
    }
  }

  if (!url) {
    url = message.author.displayAvatarURL({ size: 256, extension: 'png' })
  }

  return url
}

export const musicValidations = [
  {
    callback: ({ client, guildId }) => client.musicManager.getPlayer(guildId),
    message: "🚫 I'm not in a voice channel.",
  },
  {
    callback: ({ member }) => member.voice?.channelId,
    message: '🚫 You need to join my voice channel.',
  },
  {
    callback: ({ member, client, guildId }) =>
      member.voice?.channelId ===
      client.musicManager.getPlayer(guildId)?.voiceChannelId,
    message: "🚫 You're not in the same voice channel.",
  },
]
