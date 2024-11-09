// src/helpers/BotUtils.ts

import { HttpUtils } from '@helpers/HttpUtils'
import Logger from '@helpers/Logger'
import { Message } from 'discord.js'

interface VersionResponse {
  success: boolean
  data?: {
    tag_name: string
  }
}

interface MusicValidation {
  callback: (params: { client: any; guildId: string; member: any }) => any
  message: string
}

export class BotUtils {
  /**
   * Check if the bot is up to date
   */
  static async checkForUpdates(): Promise<void> {
    const response: VersionResponse = await HttpUtils.getJson(
      'https://api.github.com/repos/saiteja-madha/discord-js-bot/releases/latest'
    )
    if (!response.success)
      return Logger.error('VersionCheck: Failed to check for bot updates')
    if (response.data) {
      if (
        require('@root/package.json').version.replace(/[^0-9]/g, '') >=
        response.data.tag_name.replace(/[^0-9]/g, '')
      ) {
        Logger.success('VersionCheck: Your discord bot is up to date')
      } else {
        Logger.warn(
          `VersionCheck: ${response.data.tag_name} update is available`
        )
        Logger.warn(
          'download: https://github.com/saiteja-madha/discord-js-bot/releases/latest'
        )
      }
    }
  }

  /**
   * Get the image url from the message
   * @param {Message} message
   * @param {string[]} args
   */
  static async getImageFromMessage(
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

    if (!url && args.length === 0)
      url = message.author.displayAvatarURL({ size: 256, extension: 'png' })

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
      const member = await message.guild?.members.resolve(args[0])
      if (member)
        url = member.user.displayAvatarURL({ size: 256, extension: 'png' })
    }

    if (!url)
      url = message.author.displayAvatarURL({ size: 256, extension: 'png' })

    return url
  }

  static get musicValidations(): MusicValidation[] {
    return [
      {
        callback: ({ client, guildId }) =>
          client.musicManager.getPlayer(guildId),
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
  }
}
