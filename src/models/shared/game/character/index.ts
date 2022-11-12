import { E_GameIcon } from '../extra/effects'

export type T_CharacterId = string
export type T_EffectId = string

export interface I_Character {
  id: T_CharacterId
  name: string
  description: string
  avatar: string
  level: number
  bars: T_CharacterBar[]
  specials: T_CharacterSpecial[]
  effects: T_EffectId[]
}

export type T_CharacterBar = {
  // name: string
  id: string
  current: number
  max: number
  // color: string
}

export type T_CharacterSpecial = {
  id: string
  // name: string
  current: number
}

export enum E_EffectType {
  negative = 'negative',
  neutral = 'neutral',
  positive = 'positive',
}

export type T_CharacterEffect = {
  id: T_EffectId
  name: string
  description: string
  icon: E_GameIcon
  type: E_EffectType
}

export interface I_CharactersSettings {
  permissions: {
    'player-update-characters': boolean
    'master-update-characters': boolean
  }
  bars: T_CharacterBar[]
  specials: T_CharacterSpecial[]
  effects: T_CharacterEffect[]
}
