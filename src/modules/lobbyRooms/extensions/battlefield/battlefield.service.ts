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
  T_DummyId,
} from 'models/shared/game/dummy'
import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'
import { E_Battlefield } from 'models/shared/game/battlefield'
import {
  I_Character,
  T_BaseCharacterBar,
  T_BaseCharacterSpecial,
  T_CharacterId,
} from 'models/shared/game/character'
import { I_FullRoom, I_RoomMessage, T_UserId } from 'models/shared/app'
import { regExp } from 'utils/helpers/regExp'

@Injectable()
export class BattlefieldService {
  constructor(private lobbyRooms: LobbyRoomsService) {}

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

  makeAction({
    roomId,
    action,
    actionTarget,
    actionInitiator,
    userId,
  }: I_MakeAction): {
    characters: I_Character[]
    masterField: T_Dummy[]
    playersField: T_Dummy[]
  } {
    const room = this.lobbyRooms.findRoomById(roomId)

    // Поиск инициатора
    const initiator = this.findInitiator(actionInitiator, room)

    // Поиск цели
    const target = this.findTarget(actionTarget, room)

    // Вычисление формулы
    const actionValue = this.transformActionToValue(
      action.target.value,
      initiator,
      room.game.characters.settings.bars,
      room.game.characters.settings.specials,
      room.messages,
      userId,
    )

    // Если цель является персонажем
    if (this.instanceCharacter(target)) {
      const targetBar = target.bars.find(
        (bar) => bar.id === action.target.barId,
      )
      targetBar.current += actionValue
    }
    // Если цель является болванкой
    else {
      const targetBar = target.barsCurrent.find(
        (bar) => bar.id === action.target.barId,
      )
      targetBar.value += actionValue
    }

    return {
      characters: room.game.characters.window.characters,
      masterField: room.game.battlefield.window.masterField,
      playersField: room.game.battlefield.window.playersField,
    }
  }

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

  updateDummy({ roomId, dummy, battlefield }: I_UpdateDummy): T_BaseDummy {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ] = room.game.battlefield.window[
      battlefield === E_Battlefield.master ? 'masterDummies' : 'playersDummies'
    ].map((fieldDummy) => (fieldDummy.id === dummy.id ? dummy : fieldDummy))

    return dummy
  }

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

  // HELPERS

  // Поиск инициатора действия по id
  findInitiator(
    initiatorId: T_DummyId | T_CharacterId,
    room: I_FullRoom,
  ): { baseDummy: T_BaseDummy; sampleDummy: T_Dummy } | I_Character {
    // Если инициатор персонаж
    const characterInitiator = room.game.characters.window.characters.find(
      (character) => character.id === initiatorId,
    )
    if (characterInitiator) return characterInitiator

    // Если инициатор болванка мастера
    const sampleDummyMasterInitiator =
      room.game.battlefield.window.masterField.find(
        (dummy) => dummy.subId === initiatorId,
      )
    if (sampleDummyMasterInitiator) {
      const baseDummyMasterInitiator =
        room.game.battlefield.window.masterDummies.find(
          (dummy) => dummy.id === sampleDummyMasterInitiator.id,
        )
      if (baseDummyMasterInitiator)
        return {
          baseDummy: baseDummyMasterInitiator,
          sampleDummy: sampleDummyMasterInitiator,
        }
    }

    // Если инициатор болванка игроков
    const sampleDummyPlayersInitiator =
      room.game.battlefield.window.playersField.find(
        (dummy) => dummy.subId === initiatorId,
      )
    if (sampleDummyPlayersInitiator) {
      const baseDummyPlayersInitiator =
        room.game.battlefield.window.playersDummies.find(
          (dummy) => dummy.id === sampleDummyPlayersInitiator.id,
        )

      return {
        baseDummy: baseDummyPlayersInitiator,
        sampleDummy: sampleDummyPlayersInitiator,
      }
    }
  }

  // Поиск цели
  findTarget(
    targetId: T_DummyId | T_CharacterId,
    room: I_FullRoom,
  ): T_Dummy | I_Character {
    // Если цель персонаж
    const characterInitiator = room.game.characters.window.characters.find(
      (character) => character.id === targetId,
    )
    if (characterInitiator) return characterInitiator

    // Если цель болванка мастера
    const dummyMasterInitiator = room.game.battlefield.window.masterField.find(
      (dummy) => dummy.subId === targetId,
    )
    if (dummyMasterInitiator) return dummyMasterInitiator

    // Если инициатор болванка игроков
    const dummyPlayersInitiator =
      room.game.battlefield.window.playersField.find(
        (dummy) => dummy.subId === targetId,
      )
    return dummyPlayersInitiator
  }

  transformActionToValue(
    action: string,
    initiator: { baseDummy: T_BaseDummy; sampleDummy: T_Dummy } | I_Character,
    bars: T_BaseCharacterBar[],
    specials: T_BaseCharacterSpecial[],
    roomChat: I_RoomMessage[],
    userIdInitiator: T_UserId,
  ): number {
    let result = action
      // Удаление пробелов
      .replace(regExp.onlyWhitespace, '')
      // Определение диапазонов
      .replace(regExp.onlyActionRange, (_, match) => {
        const [a, b] = match.split(',')
        return this.getRandomFromRange(Number(a), Number(b))
      })

    // Определение переменных для персонажа
    if (this.instanceCharacter(initiator)) {
      result = result.replace(regExp.onlyActionVariable, (_, match) => {
        // Если переменная равна характеристике
        const special = specials.find((special) => special.name === match)
        if (special) {
          return String(
            initiator.specials.find(
              (characterSpecial) => characterSpecial.id === special.id,
            ).current || 0,
          )
        }

        // Если переменная равна бару (нынешнее и максимальное значение)
        const bar = bars.find((bar) => match.endsWith(bar.name))
        if (bar) {
          if (match.startsWith('Max') || match.startsWith('Макс.')) {
            const maxBarValue =
              initiator.bars.find((characterBar) => characterBar.id === bar.id)
                .max || 0
            return String(maxBarValue)
          } else {
            const currentBarValue =
              initiator.bars.find((characterBar) => characterBar.id === bar.id)
                .current || 0
            return String(currentBarValue)
          }
        }

        // Если это последний бросок кубика
        if (['Ролл', 'Roll'].includes(match)) {
          for (let index = roomChat.length; index >= 0; index--) {
            const message = roomChat[index]
            console.log(message, userIdInitiator)
            if (message?.authorId === userIdInitiator && message?.command) {
              return message.text.split(' ').at(-1) || '0'
            }
          }
        }
        return '0'
      })
    }
    // Определение переменных для болванки
    else {
      result = result.replace(regExp.onlyActionVariable, (_, match) => {
        // Если переменная равна бару (нынешнее и максимальное значение)
        const bar = bars.find((bar) => match.endsWith(bar.name))
        if (bar) {
          if (match.startsWith('Max') || match.startsWith('Макс.')) {
            const maxBarValue = initiator.baseDummy.barsMax.find(
              (dummyBar) => dummyBar.id === bar.id,
            ).max
            return String(maxBarValue)
          } else {
            const currentBarValue =
              initiator.sampleDummy.barsCurrent.find(
                (dummyBar) => dummyBar.id === bar.id,
              ).value || 0
            return String(currentBarValue)
          }
        }

        // Если это последний бросок кубика
        if (['Ролл', 'Roll'].includes(match)) {
          for (let index = roomChat.length; index >= 0; index--) {
            const message = roomChat[index]
            if (message?.authorId === userIdInitiator && message?.command) {
              return message.text.split(' ').at(-1) || '0'
            }
          }
        }
        return '0'
      })
    }
    return this.calculate(result)
  }

  // Рандомное число из диапазона
  getRandomFromRange(min: number, max: number): string {
    return String(Math.floor(Math.random() * (max - min + 1) + min))
  }

  // Вычисление итогового значения
  calculate(input: string): number {
    const stack: (string | number)[] = []

    let num = 0
    let op = '+'

    for (let i = 0; i < input.length; i++) {
      const item = input[i]

      if (!isNaN(parseInt(item))) {
        num = num * 10 + parseInt(item)
      }

      if (item === '(') {
        // Рекурсивно вычисляем значение в скобках
        const subInput = this.getSubInput(input.substring(i))
        num = this.calculate(subInput)
        i += subInput.length + 1
      }

      if (isNaN(parseInt(item)) || i === input.length - 1) {
        if (op === '+') {
          stack.push(num)
        } else if (op === '-') {
          stack.push(-num)
        } else if (op === '*') {
          stack.push((stack.pop() as number) * num)
        } else if (op === '/') {
          stack.push((stack.pop() as number) / num)
        }

        num = 0
        op = item
      }
    }

    return (stack as number[]).reduce((acc, val) => acc + val, 0)
  }

  // Вычисление вложенных
  getSubInput(input: string): string {
    let count = 1
    let subInput = ''

    for (let i = 1; i < input.length; i++) {
      if (input[i] === '(') {
        count++
      } else if (input[i] === ')') {
        count--
      }

      if (count === 0) {
        break
      }

      subInput += input[i]
    }

    return subInput
  }

  // Проверка сущности
  instanceCharacter(entity: any): entity is I_Character {
    return 'level' in entity
  }
}
