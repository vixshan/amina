import 'dotenv/config'
import 'module-alias/register'

// register extenders
import '@helpers/extenders/Message'
import '@helpers/extenders/Guild'
import '@helpers/extenders/GuildChannel'

import { checkForUpdates } from '@helpers/BotUtils'
import { initializeMongoose } from '@src/database/mongoose'
import { BotClient } from '@src/structures'
import { validateConfiguration } from '@helpers/Validator'
import type { Subprocess } from 'bun'
import config from '@src/config'

validateConfiguration()

// Define types for the client
declare global {
  var client: BotClient | undefined
}

async function initializeBot(): Promise<BotClient> {
  try {
    // initialize client
    global.client = new BotClient()

    // check for updates
    await checkForUpdates()

    // Initialize mongoose first
    await initializeMongoose()

    // Load commands and events
    await global.client.loadCommands('./src/commands')
    global.client.loadContexts('./src/contexts')
    global.client.loadEvents('./src/events')

    // start the client
    await global.client.login(process.env.BOT_TOKEN)

    // Initialize dashboard last, after bot is ready
    if (config.DASHBOARD.enabled) {
      global.client.logger.log('Launching dashboard...')
      try {
        // Bun.spawn() with specific configuration
        const dashboardProcess: Subprocess = Bun.spawn(
          ['bun', 'run', 'astro/dist/server/entry.mjs'],
          {
            stderr: 'pipe',
            stdout: 'pipe',
            env: {
              ...process.env,
            },
            onExit(proc, exitCode, signalCode, error) {
              if (error) {
                global.client?.logger.error('Dashboard process error:', error)
              }
              if (exitCode !== 0) {
                global.client?.logger.warn(
                  `Dashboard process exited with code ${exitCode}`
                )
              }
            },
          }
        )

        // Set up stream handling
        if (dashboardProcess.stdout && dashboardProcess.stderr) {
          // Type guard function
          function isReadableStream(stream: any): stream is ReadableStream {
            return stream instanceof ReadableStream
          }

          // Stdout handling
          if (isReadableStream(dashboardProcess.stdout)) {
            dashboardProcess.stdout
              .pipeTo(
                new WritableStream({
                  write(chunk) {
                    process.stdout.write(chunk)
                  },
                })
              )
              .catch((err: unknown) => {
                global.client?.logger.error(
                  'Error in stdout stream:',
                  err as Error
                )
              })
          }

          // Stderr handling
          if (isReadableStream(dashboardProcess.stderr)) {
            dashboardProcess.stderr
              .pipeTo(
                new WritableStream({
                  write(chunk) {
                    process.stderr.write(chunk)
                  },
                })
              )
              .catch((err: unknown) => {
                global.client?.logger.error(
                  'Error in stderr stream:',
                  err as Error
                )
              })
          }
        }

        // Handle cleanup
        process.on('SIGTERM', () => {
          dashboardProcess.kill('SIGTERM')
        })
      } catch (ex) {
        global.client.logger.error('Failed to launch dashboard:', ex as Error)
        global.client.logger.warn('Continuing bot operation without dashboard')
      }
    }

    return global.client
  } catch (error) {
    if (global.client) {
      global.client.logger.error('Failed to initialize bot:', error as Error)
    } else {
      console.error('Failed to initialize bot:', error)
    }
    process.exit(1)
  }
}

// Global error handling
process.on('unhandledRejection', (err: Error) => {
  if (global.client) {
    global.client.logger.error('Unhandled Rejection:', err)
  } else {
    console.error('Unhandled Rejection:', err)
  }
})

process.on('uncaughtException', (err: Error) => {
  if (global.client) {
    global.client.logger.error('Uncaught Exception:', err)
  } else {
    console.error('Uncaught Exception:', err)
  }
})

// Initialize the bot
initializeBot().catch((error: Error) => {
  console.error('Failed to start bot:', error)
  process.exit(1)
})

// For type safety, export the client type
export type { BotClient }
