export enum ApplicationCommandType {
  User = 'USER',
  Message = 'MESSAGE',
}

export type ContextDataType = {
  name: string
  description: string
  type: ApplicationCommandType
  enabled: boolean
  ephemeral: boolean
  options: boolean
  userPermissions: string[]
  cooldown: number
}

export const ContextData: ContextDataType = {
  name: '',
  description: '',
  type: ApplicationCommandType.User,
  enabled: false,
  ephemeral: false,
  options: true,
  userPermissions: [],
  cooldown: 0,
}
