import { T_RoomId } from 'models/shared/app'
import {
  I_Character,
  T_BaseCharacterEffect,
  T_BaseCharacterSpecial,
  T_CharacterId,
} from 'models/shared/game/character'

export interface I_UpdateCharactersSettingsSpecials {
  roomId: T_RoomId
  specials: T_BaseCharacterSpecial[]
}

export interface I_UpdateCharactersSettingsEffects {
  roomId: T_RoomId
  effects: T_BaseCharacterEffect[]
}

export interface I_CreateCharacter {
  roomId: T_RoomId
  character: I_Character
}

export interface I_UpdateCharacter {
  roomId: T_RoomId
  character: I_Character
}

export interface I_UpdateCharacterField {
  roomId: T_RoomId
  characterId: T_CharacterId
  field: string
  value: string | number
  subFieldId?: string
}

export interface I_RemoveCharacter {
  roomId: T_RoomId
  characterId: T_CharacterId
}
