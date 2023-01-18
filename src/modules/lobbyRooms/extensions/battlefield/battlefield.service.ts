import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import {
  I_AddDummyToBattlefield,
  I_CreateDummy,
  I_MakeAction,
  I_RemoveDummiesFromBattlefield,
  I_RemoveDummy,
  I_RemoveDummyFromBattlefield,
  I_UpdateDummy,
  I_UpdateDummyField,
  I_UpdateDummyFieldOnBattlefield,
} from './models/service.model'

import {
  T_BaseDummy,
  T_Dummy,
  T_DummyBarsCurrent,
  T_DummyBarsMax,
} from 'models/shared/game/dummy'
import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'
import { E_Battlefield } from 'models/shared/game/battlefield'
import { I_Character } from 'models/shared/game/character'

@Injectable()
export class BattlefieldService {
  constructor(private lobbyRooms: LobbyRoomsService) {}

  // Создание экземпляра болванки
  createDummy({ roomId, dummy, battlefield }: I_CreateDummy): T_BaseDummy {
    const room = this.lobbyRooms.findRoomById(roomId)
    if (battlefield === 'master') {
      room.game.battlefield.window.masterDummies.push(dummy)
    }
    if (battlefield === 'players') {
      room.game.battlefield.window.playersDummies.push(dummy)
    }
    return dummy
  }

  // Добавление болванки на поле боя
  addDummyToBattlefield({
    roomId,
    dummy,
    battlefield,
  }: I_AddDummyToBattlefield): T_Dummy[] {
    const room = this.lobbyRooms.findRoomById(roomId)
    const fieldDummy: T_Dummy = {
      id: dummy.id,
      subId: v4(),
      barsCurrent: dummy.barsMax.map((bar) => ({ id: bar.id, value: bar.max })),
    }
    if (battlefield === E_Battlefield.master) {
      room.game.battlefield.window.masterField.push(fieldDummy)
      return room.game.battlefield.window.masterField
    }
    if (battlefield === E_Battlefield.players) {
      room.game.battlefield.window.playersField.push(fieldDummy)
      return room.game.battlefield.window.playersField
    }
  }

  // Выполнение действия между карточками болванок или игроков
  makeAction({ roomId, action, actionTarget }: I_MakeAction): {
    characters: I_Character[]
    masterField: T_Dummy[]
    playersField: T_Dummy[]
  } {
    const room = this.lobbyRooms.findRoomById(roomId)

    const targetDummyMasterField =
      room.game.battlefield.window.masterField.find(
        (dummy) => dummy.subId === actionTarget,
      )

    // Если цель находится на поле ведущего
    if (targetDummyMasterField) {
      const targetBar = targetDummyMasterField.barsCurrent.find(
        (bar) => bar.id === action.target.barId,
      )

      if (targetBar) {
        targetBar.value += Number(action.target.value)
      }
    }

    // Если цель находится на поле игроков
    const targetDummyPlayersField =
      room.game.battlefield.window.playersField.find(
        (dummy) => dummy.subId === actionTarget,
      )
    if (targetDummyPlayersField) {
      const targetBar = targetDummyPlayersField.barsCurrent.find(
        (bar) => bar.id === action.target.barId,
      )
      if (targetBar) {
        targetBar.value += Number(action.target.value)
      }
    }

    // Если цель является персонажем
    const targetCharacter = room.game.characters.window.characters.find(
      (character) => character.id === actionTarget,
    )
    if (targetCharacter) {
      const targetBar = targetCharacter.bars.find(
        (bar) => bar.id === action.target.barId,
      )
      if (targetBar) {
        targetBar.current += Number(action.target.value)
      }
    }

    return {
      characters: room.game.characters.window.characters,
      masterField: room.game.battlefield.window.masterField,
      playersField: room.game.battlefield.window.playersField,
    }
  }

  // Быстрое изменение поля конкретного экземпляра болванки
  updateDummyField({
    roomId,
    dummyId,
    field,
    value,
    battlefield,
    subFieldId,
  }: I_UpdateDummyField): T_BaseDummy {
    const room = this.lobbyRooms.findRoomById(roomId)

    const baseDummy = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ].find((dummy) => dummy.id === dummyId)
    if (subFieldId) {
      baseDummy[field] = baseDummy[field].map((item: T_DummyBarsMax) =>
        item.id === subFieldId ? { ...item, max: value } : item,
      )
    }

    if (!subFieldId) {
      baseDummy[field] = value
    }

    return baseDummy
  }

  // Обновление экземпляра болванки
  updateDummy({ roomId, dummy, battlefield }: I_UpdateDummy): T_BaseDummy {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ] = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ].map((fieldDummy) => (fieldDummy.id === dummy.id ? dummy : fieldDummy))

    return dummy
  }

  // Быстрое изменение поля конкретной болванки
  updateDummyFieldOnBattlefield({
    roomId,
    battlefield,
    field,
    dummySubId,
    value,
    subFieldId,
  }: I_UpdateDummyFieldOnBattlefield) {
    const room = this.lobbyRooms.findRoomById(roomId)
    const dummy = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ].find((dummy) => dummy.subId === dummySubId)

    if (subFieldId) {
      dummy[field] = dummy[field].map((item: T_DummyBarsCurrent) =>
        item.id === subFieldId ? { ...item, value } : item,
      )
    }

    return room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ]
  }

  // Удаление экземпляра болванки и болванок с поля боя
  removeDummy({ roomId, dummyId, battlefield }: I_RemoveDummy) {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ] = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ].filter((dummy) => dummy.id !== dummyId)

    room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ] = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ].filter((dummy) => dummy.id !== dummyId)

    return dummyId
  }

  // Удаление болванки с поля боя
  removeDummyOnBattlefield({
    roomId,
    dummySubId,
    battlefield,
  }: I_RemoveDummyFromBattlefield) {
    const room = this.lobbyRooms.findRoomById(roomId)

    room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ] = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ].filter((dummy) => dummy.subId !== dummySubId)

    return room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterField' : 'playersField'
    ]
  }

  // Удаление всех болванок по экземпляру с поля боя
  removeDummiesOnBattlefield({
    roomId,
    dummyId,
    battlefield,
  }: I_RemoveDummiesFromBattlefield): T_Dummy[] {
    const room = this.lobbyRooms.findRoomById(roomId)

    if (battlefield === E_Battlefield.master) {
      room.game.battlefield.window.masterField =
        room.game.battlefield.window.masterField.filter(
          (dummy) => dummy.id !== dummyId,
        )
      return room.game.battlefield.window.masterField
    }
    if (battlefield === E_Battlefield.players) {
      room.game.battlefield.window.playersField =
        room.game.battlefield.window.playersField.filter(
          (dummy) => dummy.id !== dummyId,
        )
      return room.game.battlefield.window.playersField
    }
  }
}
