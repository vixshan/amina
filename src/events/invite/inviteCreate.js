const { getInviteCache, cacheInvite } = require('@handlers/invite')

/**
 * @param {import('@/structures').BotClient} client
 * @param {import('discord.js').Invite} invite
 */
module.exports = async (client, invite) => {
  const cachedInvites = getInviteCache(invite?.guild)

  // Check if cache for the guild exists and then add it to cache
  if (cachedInvites) {
    cachedInvites.set(invite.code, cacheInvite(invite, false))
  }
}
