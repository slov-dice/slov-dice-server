import { Injectable } from '@nestjs/common'

import {
  I_CreateCharacter,
  I_RemoveCharacter,
  I_UpdateCharacter,
  I_UpdateCharacterField,
  I_UpdateCharactersSettingsEffects,
  I_UpdateCharactersSettingsSpecials,
} from './models/service.model'

import { T_RoomId } from 'models/shared/app'
import {
  I_Character,
  T_BaseCharacterEffect,
  T_BaseCharacterSpecial,
  T_CharacterBar,
  T_CharacterId,
  T_CharacterSpecial,
} from 'models/shared/game/character'
import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'

@Injectable()
export class CharactersService {
  constructor(private lobbyRooms: LobbyRoomsService) {}

  updateCharactersSettingsSpecials({
    roomId,
    specials,
  }: I_UpdateCharactersSettingsSpecials): {
    settingsSpecials: T_BaseCharacterSpecial[]
    characters: I_Character[]
  } {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.characters.settings.specials = specials

    room.game.characters.window.characters =
      room.game.characters.window.characters.reduce((acc, character) => {
        character.specials = specials.reduce((acc, settingsSpecial) => {
          const characterSpecial = character.specials.find(
            (characterSpecial) => characterSpecial.id === settingsSpecial.id,
          )

          if (characterSpecial) {
            acc.push(characterSpecial)
          }
          if (!characterSpecial) {
            acc.push({ id: settingsSpecial.id, current: 5 })
          }

          return acc
        }, [] as T_CharacterSpecial[])
        acc.push(character)
        return acc
      }, [])

    return {
      settingsSpecials: room.game.characters.settings.specials,
      characters: room.game.characters.window.characters,
    }
  }

  updateCharactersSettingsEffects({
    roomId,
    effects,
  }: I_UpdateCharactersSettingsEffects): {
    settingsEffects: T_BaseCharacterEffect[]
    characters: I_Character[]
  } {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.characters.settings.effects = effects

    room.game.characters.window.characters =
      room.game.characters.window.characters.reduce((acc, character) => {
        character.effects = effects.reduce((acc, settingsEffect) => {
          const characterEffect = character.effects.find(
            (characterEffect) => characterEffect === settingsEffect.id,
          )

          if (characterEffect) {
            acc.push(characterEffect)
          }

          return acc
        }, [] as string[])
        acc.push(character)
        return acc
      }, [])

    return {
      settingsEffects: room.game.characters.settings.effects,
      characters: room.game.characters.window.characters,
    }
  }

  createCharacter({ roomId, character }: I_CreateCharacter): I_Character {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.characters.window.characters.push(character)
    return character
  }

  updateCharacter({ roomId, character }: I_UpdateCharacter): I_Character {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.characters.window.characters =
      room.game.characters.window.characters.map((roomCharacter) =>
        roomCharacter.id === character.id ? character : roomCharacter,
      )

    return character
  }

  updateCharacterField({
    roomId,
    characterId,
    field,
    value,
    subFieldId,
  }: I_UpdateCharacterField): I_Character {
    const room = this.lobbyRooms.findRoomById(roomId)
    const character = room.game.characters.window.characters.find(
      (character) => character.id === characterId,
    )

    if (field === 'effects') {
      if (character.effects.includes(value as string)) {
        character.effects = character.effects.filter(
          (effectId) => effectId !== value,
        )
      } else {
        character.effects.push(value as string)
      }

      return character
    }

    if (subFieldId) {
      character[field] = character[field].map(
        (item: T_CharacterBar | T_CharacterSpecial) =>
          item.id === subFieldId ? { ...item, current: value } : item,
      )
    }

    if (!subFieldId) character[field] = value
    return character
  }

  removeCharacter({ roomId, characterId }: I_RemoveCharacter): T_CharacterId {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.characters.window.characters =
      room.game.characters.window.characters.filter(
        (character) => character.id !== characterId,
      )
    return characterId
  }
}
