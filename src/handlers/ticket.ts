import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  ComponentType,
  Guild,
  User,
  BaseGuildTextChannel,
  ButtonInteraction,
  Channel,
} from 'discord.js'

import { TICKET } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { postToBin } from '@helpers/HttpUtils'
import { error } from '@helpers/Logger'
import { GuildSettings } from '@src/types/Guild'

const OPEN_PERMS = ['ManageChannels']
const CLOSE_PERMS = ['ManageChannels', 'ReadMessageHistory']

/**
 * @param {import('discord.js').Channel} channel
 */
const isTicketChannel = (channel: BaseGuildTextChannel): boolean => {
  return (
    (channel.type === ChannelType.GuildText &&
      channel.name.startsWith('tіcket-') &&
      channel.topic?.startsWith('tіcket|')) ||
    false
  )
}

/**
 * @param {import('discord.js').Guild} guild
 */
const getTicketChannels = guild => {
  return guild.channels.cache.filter(ch => isTicketChannel(ch))
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 */
const getExistingTicketChannel = (guild, userId) => {
  const tktChannels = getTicketChannels(guild)
  return tktChannels.find(ch => ch.topic?.split('|')[1] === userId)
}

/**
 * @param {import('discord.js').BaseGuildTextChannel} channel
 */
const parseTicketDetails = async channel => {
  if (!channel.topic) return
  const [, userId, catName = 'Default'] = channel.topic.split('|')

  const user = await channel.client.users
    .fetch(userId, { cache: false })
    .catch(() => undefined)

  return { user, catName }
}

/**
 * @param {import('discord.js').BaseGuildTextChannel} channel
 * @param {import('discord.js').User} closedBy
 * @param {string} [reason]
 */
const closeTicket = async (channel, closedBy, reason) => {
  if (
    !channel.deletable ||
    !channel.permissionsFor(channel.guild.members.me).has(CLOSE_PERMS)
  ) {
    return 'MISSING_PERMISSIONS'
  }

  try {
    const config = await getSettings(channel.guild)
    const messages = await channel.messages.fetch()
    const reversed = Array.from(messages.values()).reverse()

    const content = reversed
      .map((m: import('discord.js').Message) => {
        let messageContent = `[${new Date(m.createdAt).toLocaleString('en-US')}] - ${m.author.username}\n`
        if (m.cleanContent) messageContent += `${m.cleanContent}\n`
        if (m.attachments.size > 0) {
          messageContent += `${m.attachments.map(att => att.proxyURL).join(', ')}\n`
        }
        return messageContent + '\n'
      })
      .join('')

    const logsUrl = await postToBin(content, `Ticket Logs for ${channel.name}`)
    const ticketDetails = await parseTicketDetails(channel)

    const components = []
    if (logsUrl) {
      components.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Transcript')
            .setURL(logsUrl.short)
            .setStyle(ButtonStyle.Link)
        )
      )
    }

    if (channel.deletable) await channel.delete()

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Ticket Closed' })
      .setColor(TICKET.CLOSE_EMBED)

    const fields = [
      ...(reason ? [{ name: 'Reason', value: reason, inline: false }] : []),
      {
        name: 'Opened By',
        value: ticketDetails?.user?.username ?? 'Unknown',
        inline: true,
      },
      {
        name: 'Closed By',
        value: closedBy?.username ?? 'Unknown',
        inline: true,
      },
    ]

    embed.setFields(fields)

    // Send embed to log channel
    if (config.ticket.log_channel) {
      const logChannel = channel.guild.channels.cache.get(
        config.ticket.log_channel
      )
      await logChannel?.safeSend({ embeds: [embed], components })
    }

    // Send embed to user
    if (ticketDetails?.user) {
      const dmEmbed = embed
        .setDescription(
          `**Server:** ${channel.guild.name}\n**Topic:** ${ticketDetails.catName}`
        )
        .setThumbnail(channel.guild.iconURL())
      await ticketDetails.user
        .send({ embeds: [dmEmbed], components })
        .catch(() => {})
    }

    return 'SUCCESS'
  } catch (ex) {
    error('closeTicket', ex)
    return 'ERROR'
  }
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} author
 */
const closeAllTickets = async (guild, author) => {
  const channels = getTicketChannels(guild)
  const results = await Promise.all(
    Array.from(channels.values()).map(channel =>
      closeTicket(channel, author, 'Force close all open tickets')
    )
  )

  return results.reduce(
    (acc, status) => {
      status === 'SUCCESS' ? acc[0]++ : acc[1]++
      return acc
    },
    [0, 0]
  )
}

/**
 * @param {import("discord.js").ButtonInteraction} interaction
 */
const handleTicketOpen = async interaction => {
  await interaction.deferReply({ ephemeral: true })
  const { guild, user } = interaction

  if (!guild.members.me.permissions.has(OPEN_PERMS)) {
    return interaction.followUp(
      'Cannot create ticket channel, missing `Manage Channel` permission. Contact server manager for help!'
    )
  }

  const alreadyExists = getExistingTicketChannel(guild, user.id)
  if (alreadyExists) {
    return interaction.followUp('You already have an open ticket')
  }

  const settings = await getSettings(guild)

  // Limit check
  const existing = getTicketChannels(guild).size
  if (existing > settings.ticket.limit) {
    return interaction.followUp(
      'There are too many open tickets. Try again later'
    )
  }

  // Check topics
  let catName = null
  let catPerms = []
  const { topics } = settings.ticket

  if (topics.length > 0) {
    const options = topics.map(cat => ({
      label: cat.name,
      value: cat.name,
    }))

    const menuRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket-menu')
        .setPlaceholder('topic category')
        .addOptions(options)
    )

    await interaction.followUp({
      content: 'Please choose a topic for the ticket',
      components: [menuRow],
    })

    const res = await interaction.channel
      .awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        time: 60_000,
      })
      .catch(() => undefined)

    if (!res) {
      return interaction.editReply({
        content: 'Timed out. Try again',
        components: [],
      })
    }

    await interaction.editReply({ content: 'Processing', components: [] })
    catName = res.values[0]
    catPerms = settings.server.staff_roles ?? []
  }

  try {
    const ticketNumber = (existing + 1).toString()
    const permissionOverwrites = [
      {
        id: guild.roles.everyone,
        deny: ['ViewChannel'],
      },
      {
        id: user.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
      {
        id: guild.members.me.roles.highest.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
      ...(catPerms
        ?.map(roleId => {
          const role = guild.roles.cache.get(roleId)
          return role
            ? {
                id: role,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
              }
            : null
        })
        .filter(Boolean) ?? []),
    ]

    // Get channel parent
    let parent = guild.channels.cache.get(settings.ticket.category)

    if (!parent) {
      parent = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['ViewChannel'],
          },
        ],
      })

      settings.ticket.category = parent.id
      settings.ticket.enabled = true
      await updateSettings(guild.id, settings)
    }

    const tktChannel = await guild.channels.create({
      name: `tіcket-${ticketNumber}`,
      parent: parent.id,
      type: ChannelType.GuildText,
      topic: `tіcket|${user.id}|${catName ?? 'Default'}`,
      permissionOverwrites,
    })

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Ticket #${ticketNumber}` })
      .setDescription(
        `Hello ${user.toString()}
        Support will be with you shortly
        ${catName ? `\n**Topic:** ${catName}` : ''}`
      )
      .setFooter({
        text: 'You may close your ticket anytime by clicking the button below',
      })

    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Close Ticket')
        .setCustomId('TICKET_CLOSE')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Primary)
    )

    const sent = await tktChannel.send({
      content: user.toString(),
      embeds: [embed],
      components: [buttonsRow],
    })

    const dmEmbed = new EmbedBuilder()
      .setColor(TICKET.CREATE_EMBED)
      .setAuthor({ name: 'Ticket Created' })
      .setThumbnail(guild.iconURL())
      .setDescription(
        `**Server:** ${guild.name}
        ${catName ? `**Topic:** ${catName}` : ''}`
      )

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View Channel')
        .setURL(sent.url)
        .setStyle(ButtonStyle.Link)
    )

    await user.send({ embeds: [dmEmbed], components: [row] }).catch(() => {})
    await interaction.editReply('Ticket created! 🔥')
  } catch (ex) {
    error('handleTicketOpen', ex)
    return interaction.editReply(
      'Failed to create ticket channel, an error occurred!'
    )
  }
}

/**
 * @param {import("discord.js").ButtonInteraction} interaction
 */
const handleTicketClose = async interaction => {
  await interaction.deferReply({ ephemeral: true })
  const status = await closeTicket(
    interaction.channel,
    interaction.user,
    'User requested closure'
  )
  if (status === 'MISSING_PERMISSIONS') {
    return interaction.followUp(
      'Cannot close the ticket, missing permissions. Contact server manager for help!'
    )
  }

  if (status === 'ERROR') {
    return interaction.followUp(
      'Failed to close the ticket, an error occurred!'
    )
  }
}

export default {
  getTicketChannels,
  getExistingTicketChannel,
  isTicketChannel,
  closeTicket,
  closeAllTickets,
  handleTicketOpen,
  handleTicketClose,
}
