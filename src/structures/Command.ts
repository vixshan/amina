// src/structures/Command.ts
export type CommandType = {
  name: string
  description: string
  cooldown: number
  isPremium: boolean
  category: string
  botPermissions: string[]
  userPermissions: string[]
  validations: any[]
  slashCommand: {
    enabled: boolean
    ephemeral: boolean
    options: any[]
  }
  testGuildOnly?: boolean
  devOnly?: boolean
  interactionRun: (interaction: any, data: any) => void
}

export const Command = {
  name: '',
  description: '',
  cooldown: 0,
  isPremium: false,
  category: 'NONE',
  botPermissions: [] as string[],
  userPermissions: [] as string[],
  validations: [] as any[],
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [] as any[],
  },
  interactionRun: (interaction: any, data: any) => {},
} as const

export default Command
