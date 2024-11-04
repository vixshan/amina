// @root/src/index.js
require('dotenv').config()
require('module-alias/register')

// register extenders
require('@helpers/extenders/Message')
require('@helpers/extenders/Guild')
require('@helpers/extenders/GuildChannel')

const { checkForUpdates } = require('@helpers/BotUtils')
const { initializeMongoose } = require('@src/database/mongoose')
const { BotClient } = require('@src/structures')
const { validateConfiguration } = require('@helpers/Validator')

validateConfiguration()

// Declare client in global scope
let client

async function initializeBot() {
  try {
    // initialize client
    client = new BotClient() // Remove 'const' here since we're using the global client

    // check for updates
    await checkForUpdates()

    // Initialize mongoose first
    await initializeMongoose()

    // Load commands and events
    await client.loadCommands('./src/commands')
    client.loadContexts('./src/contexts')
    client.loadEvents('./src/events')

    // start the client
    await client.login(process.env.BOT_TOKEN)

    // Initialize dashboard last, after bot is ready
    if (client.config.DASHBOARD.enabled) {
      client.logger.log('Launching dashboard...')
      try {
        const { exec } = require('child_process')
        const dashboardProcess = exec('node astro/dist/server/entry.mjs')

        dashboardProcess.stdout.on('data', data => {
          client.logger.log(`Dashboard: ${data}`)
        })

        dashboardProcess.stderr.on('data', data => {
          client.logger.error(`Dashboard Error: ${data}`)
        })

        dashboardProcess.on('close', code => {
          client.logger.log(`Dashboard process exited with code ${code}`)
        })
      } catch (ex) {
        client.logger.error('Failed to launch dashboard:', ex)
        client.logger.warn('Continuing bot operation without dashboard')
      }
    }

    return client
  } catch (error) {
    if (client) {
      client.logger.error('Failed to initialize bot:', error)
    } else {
      console.error('Failed to initialize bot:', error)
    }
    process.exit(1)
  }
}

// Global error handling
process.on('unhandledRejection', err => {
  if (client) {
    client.logger.error('Unhandled Rejection:', err)
  } else {
    console.error('Unhandled Rejection:', err)
  }
})

process.on('uncaughtException', err => {
  if (client) {
    client.logger.error('Uncaught Exception:', err)
  } else {
    console.error('Uncaught Exception:', err)
  }
})

// Initialize the bot
initializeBot().catch(error => {
  console.error('Failed to start bot:', error)
  process.exit(1)
})
