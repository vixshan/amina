import config from '@/config'
import { EmbedBuilder, WebhookClient, ColorResolvable } from 'discord.js'
import pino, { Logger as PinoLogger, MultiStreamRes } from 'pino'

type LogContent = string | Error
type LogError = Error | undefined

const webhookLogger: WebhookClient | undefined = process.env.LOGS_WEBHOOK
  ? new WebhookClient({
      url: process.env.LOGS_WEBHOOK,
    })
  : undefined

const today = new Date()
const pinoLogger: PinoLogger = pino(
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
        dest: `${process.cwd()}/logs/combined-${today.getFullYear()}.${
          today.getMonth() + 1
        }.${today.getDate()}.log`,
        sync: true,
        mkdir: true,
      }),
    },
  ]) as MultiStreamRes
)

async function sendWebhook(
  content: LogContent | undefined,
  err: LogError
): Promise<void> {
  if (!content && !err) return
  const errString = err?.stack || err?.toString()

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.ERROR as ColorResolvable)
    .setAuthor({ name: err?.name || 'Error' })

  if (errString) {
    embed.setDescription(
      '```js\n' +
        (errString.length > 4096
          ? `${errString.substring(0, 4000)}...`
          : errString) +
        '\n```'
    )
  }

  embed.addFields({
    name: 'Description',
    value: (content?.toString() || err?.message || 'NA').slice(0, 1024),
  })

  try {
    if (webhookLogger) {
      await webhookLogger.send({
        username: 'Logs',
        embeds: [embed],
      })
    }
  } catch (ex) {
    // Silently handle webhook errors
  }
}

export default class Logger {
  static success(content: LogContent): void {
    pinoLogger.info(content)
  }

  static log(content: LogContent): void {
    pinoLogger.info(content)
  }

  static warn(content: LogContent): void {
    pinoLogger.warn(content)
  }

  static error(content: LogContent, ex?: LogError): void {
    if (ex) {
      pinoLogger.error(ex, `${content}: ${ex?.message}`)
    } else {
      pinoLogger.error(content)
    }
    if (webhookLogger) void sendWebhook(content, ex)
  }

  static debug(content: LogContent): void {
    pinoLogger.debug(content)
  }
}
export function log(arg0: string) {
  throw new Error('Function not implemented.')
}

export function error(arg0: string, ex: unknown) {
  throw new Error('Function not implemented.')
}

export function warn(arg0: string) {
  throw new Error('Function not implemented.')
}
