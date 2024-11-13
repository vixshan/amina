import config from '@src/config'
import { EmbedBuilder, WebhookClient } from 'discord.js'
import pino from 'pino'

const webhookLogger = process.env.LOGS_WEBHOOK
  ? new WebhookClient({
      url: process.env.LOGS_WEBHOOK,
    })
  : undefined

const today = new Date()
const pinoLogger = pino(
  {
    level: 'debug',
  },
  pino.multistream([
    {
      level: 'info',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:mm:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          hideObject: true,
          customColors: 'info:blue,warn:yellow,error:red',
        },
      }),
    },
    {
      level: 'debug',
      stream: pino.destination({
        dest: `${process.cwd()}/logs/combined-${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}.log`,
        sync: true,
        mkdir: true,
      }),
    },
  ])
)

function sendWebhook(content, err) {
  if (!content && !err) return
  const errString = err?.stack || err

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.ERROR)
    .setAuthor({ name: err?.name || 'Error' })

  if (errString)
    embed.setDescription(
      '```js\n' +
        (errString.length > 4096
          ? `${errString.substr(0, 4000)}...`
          : errString) +
        '\n```'
    )

  embed.addFields({
    name: 'Description',
    value: content || err?.message || 'NA',
  })
  webhookLogger
    .send({
      username: 'Logs',
      embeds: [embed],
    })
    .catch(() => {})
}

/**
 * @param {string} content
 */
export function success(content) {
  pinoLogger.info(content)
}

/**
 * @param {string} content
 */
export function log(content) {
  pinoLogger.info(content)
}

/**
 * @param {string} content
 */
export function warn(content) {
  pinoLogger.warn(content)
}

/**
 * @param {string} content
 * @param {object} ex
 */
export function error(content, ex) {
  if (ex) {
    pinoLogger.error(ex, `${content}: ${ex?.message}`)
  } else {
    pinoLogger.error(content)
  }
  if (webhookLogger) sendWebhook(content, ex)
}

/**
 * @param {string} content
 */
export function debug(content) {
  pinoLogger.debug(content)
}

// Also export the class for backward compatibility or class-based usage
export default class Logger {
  static success = success
  static log = log
  static warn = warn
  static error = error
  static debug = debug
}
