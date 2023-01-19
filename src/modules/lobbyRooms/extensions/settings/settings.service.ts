import { Injectable } from '@nestjs/common'

import { T_RoomId } from 'models/shared/app'
import {
  I_Character,
  T_BaseCharacterBar,
  T_CharacterBar,
} from 'models/shared/game/character'
import { T_BaseDummy, T_DummyBarsMax } from 'models/shared/game/dummy'
import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'

@Injectable()
export class SettingsService {
  constructor(private lobbyRooms: LobbyRoomsService) {}

  updateCharactersWindowSettingsBars(
    roomId: T_RoomId,
    bars: T_BaseCharacterBar[],
  ): {
    settingsBars: T_BaseCharacterBar[]
    characters: I_Character[]
    masterDummies: T_BaseDummy[]
    playersDummies: T_BaseDummy[]
  } {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.characters.settings.bars = bars

    // Обновление баров у персонажей
    room.game.characters.window.characters =
      room.game.characters.window.characters.reduce((acc, character) => {
        character.bars = bars.reduce((acc, settingsBar) => {
          const characterBar = character.bars.find(
            (characterBar) => settingsBar.id === characterBar.id,
          )
          if (characterBar) {
            acc.push(characterBar)
          }
          if (!characterBar) {
            acc.push({ id: settingsBar.id, current: 100, max: 100 })
          }
          return acc
        }, [] as T_CharacterBar[])
        acc.push(character)
        return acc
      }, [])

    // Обновление баров у болванок ведущего
    room.game.battlefield.window.masterDummies =
      room.game.battlefield.window.masterDummies.reduce((acc, dummy) => {
        dummy.barsMax = bars.reduce((acc, settingsBar) => {
          const dummyBar = dummy.barsMax.find(
            (dummyBar) => settingsBar.id === dummyBar.id,
          )
          if (dummyBar) {
            acc.push(dummyBar)
          }
          if (!dummyBar) {
            acc.push({ id: settingsBar.id, max: 100, include: false })
          }
          return acc
        }, [] as T_DummyBarsMax[])
        acc.push(dummy)
        return acc
      }, [])

    // Обновление баров у болванок игроков
    room.game.battlefield.window.playersDummies =
      room.game.battlefield.window.playersDummies.reduce((acc, dummy) => {
        dummy.barsMax = bars.reduce((acc, settingsBar) => {
          const dummyBar = dummy.barsMax.find(
            (dummyBar) => settingsBar.id === dummyBar.id,
          )
          if (dummyBar) {
            acc.push(dummyBar)
          }
          if (!dummyBar) {
            acc.push({ id: settingsBar.id, max: 100, include: false })
          }
          return acc
        }, [] as T_DummyBarsMax[])
        acc.push(dummy)
        return acc
      }, [])
    return {
      settingsBars: room.game.characters.settings.bars,
      characters: room.game.characters.window.characters,
      masterDummies: room.game.battlefield.window.masterDummies,
      playersDummies: room.game.battlefield.window.playersDummies,
    }
  }
}
