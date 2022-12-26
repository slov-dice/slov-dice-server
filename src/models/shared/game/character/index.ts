import { E_EffectIcon } from '../extra/effects'

export type T_CharacterId = string
export type T_CharacterEffectId = string
export type T_CharacterBarId = string
export type T_CharacterSpecialId = string
export type T_CharacterActionId = string

export interface I_CharactersSettings {
  bars: T_BaseCharacterBar[]
  specials: T_BaseCharacterSpecial[]
  effects: T_BaseCharacterEffect[]
}

export interface I_Character {
  id: T_CharacterId
  name: string
  description: string
  avatar: string
  level: number
  bars: T_CharacterBar[]
  specials: T_CharacterSpecial[]
  effects: T_CharacterEffectId[]
  actions: T_CharacterAction[]
}

export type T_CharacterAction = {
  id: T_CharacterActionId
  title: string
  description: string
  target: {
    barId: T_CharacterBarId
    value: string
  }
}

export type T_CharacterBar = {
  id: T_CharacterBarId
  current: number
  max: number
}

export type T_CharacterSpecial = {
  id: T_CharacterSpecialId
  current: number
}

export type T_BaseCharacterBar = {
  id: T_CharacterBarId
  name: string
  color: string
}

export type T_BaseCharacterSpecial = {
  id: T_CharacterSpecialId
  name: string
}

export enum E_EffectType {
  negative = 'negative',
  neutral = 'neutral',
  positive = 'positive',
}

export type T_BaseCharacterEffect = {
  id: T_CharacterEffectId
  name: string
  description: string
  icon: E_EffectIcon
  type: E_EffectType
}
