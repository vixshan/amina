import {
  ApplicationCommandType,
  ContextMenuCommandInteraction,
  PermissionResolvable,
} from 'discord.js'

export interface ContextData {
  name: string
  description: string
  type: ApplicationCommandType
  enabled?: boolean
  ephemeral?: boolean
  defaultPermission?: boolean
  options?: boolean
  userPermissions?: PermissionResolvable[]
  cooldown?: number
  run: (interaction: ContextMenuCommandInteraction) => Promise<void> | void
}

export const BaseContext: ContextData = {
  name: '',
  description: '',
  type: ApplicationCommandType.User, // Default to User, can be changed to Message
  enabled: false,
  ephemeral: false,
  defaultPermission: true,
  options: true,
  userPermissions: [],
  cooldown: 0,
  run: async (_interaction: ContextMenuCommandInteraction) => {},
}
