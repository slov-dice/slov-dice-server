import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import { lobbyRoomGameInstance } from './data'

import {
  E_RoomMessageType,
  E_RoomType,
  E_StatusServerMessage,
  I_FullRoom,
  I_LobbyUser,
  I_PreviewRoom,
  I_RoomMessage,
  T_RoomId,
  T_SocketId,
  T_UserId,
} from 'models/shared/app'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import {
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'
import { t } from 'languages'
import {
  I_Character,
  T_BaseCharacterBar,
  T_BaseCharacterEffect,
  T_BaseCharacterSpecial,
  T_CharacterAction,
  T_CharacterBar,
  T_CharacterId,
  T_CharacterSpecial,
} from 'models/shared/game/character'
import {
  T_BaseDummy,
  T_Dummy,
  T_DummyBarsCurrent,
  T_DummyBarsMax,
  T_DummyId,
} from 'models/shared/game/dummy'
import { E_Field } from 'models/shared/game/battlefield'

@Injectable()
export class LobbyRoomsService {
  constructor(private lobbyUsers: LobbyUsersService) {}

  rooms: I_FullRoom[] = []

  getAllPreviewRooms(): I_PreviewRoom[] {
    return this.rooms.map((room): I_PreviewRoom => this.fullToPreviewRoom(room))
  }

  create(
    socketId: T_SocketId,
    name: string,
    size: number,
    password: string,
    type: E_RoomType,
  ): {
    fullRoom: I_FullRoom
    previewRoom: I_PreviewRoom
    user: I_LobbyUser
  } {
    const user = this.lobbyUsers.findBySocketId(socketId)
    const roomId = v4()

    const room: I_FullRoom = {
      id: roomId,
      authorId: user.id,
      name,
      size,
      type,
      password,
      currentSize: 1,
      users: [{ userId: user.id, socketId: user.socketId }],
      messages: [],
      game: lobbyRoomGameInstance(),
    }

    const updatedUser = this.lobbyUsers.setInRoomBySocketId(socketId)
    this.rooms.push(room)
    return {
      fullRoom: room,
      previewRoom: this.fullToPreviewRoom(room),
      user: updatedUser,
    }
  }

  join(
    socketId: T_SocketId,
    roomId: T_RoomId,
    password = '',
  ): I_SubscriptionData[E_Subscribe.getFullRoom] {
    const room = this.findRoomById(roomId)

    // Если комната переполнена
    if (room.currentSize >= room.size)
      return {
        message: t('room.error.full'),
        status: E_StatusServerMessage.error,
      }

    // Если пароль не совпадает
    if (room.password !== password && room.type === E_RoomType.private)
      return {
        message: t('room.error.wrongPassword'),
        status: E_StatusServerMessage.error,
      }

    const user = this.lobbyUsers.setInRoomBySocketId(socketId)

    // Добавляем пользователя в комнату
    room.users.push({ socketId, userId: user.id })
    room.currentSize++

    return {
      fullRoom: room,
      message: t('room.success.join'),
      status: E_StatusServerMessage.success,
    }
  }

  rejoin(fullRoom: I_FullRoom, userId: T_UserId, socketId: T_SocketId) {
    fullRoom.users.map((user) => {
      if (user.userId === userId) {
        user.socketId = socketId
      }
      return user
    })
  }

  leave(
    socketId: T_SocketId,
    roomId: T_RoomId,
  ): { fullRoom: I_FullRoom; previewRoom: I_PreviewRoom } {
    const fullRoom = this.removeUser(socketId, roomId)
    const previewRoom = this.fullToPreviewRoom(fullRoom)

    return { fullRoom, previewRoom }
  }

  removeUser(socketId: T_SocketId, roomId: T_RoomId): I_FullRoom {
    const room = this.findRoomById(roomId)

    // Удаляем пользователя
    room.users = room.users.filter((user) => user.socketId !== socketId)

    // Уменьшаем количество участников
    room.currentSize--

    // Если выходит последний участник, то удаляем комнату
    if (room.currentSize <= 0) {
      this.rooms = this.rooms.filter((room) => room.id !== roomId)
    }

    return room
  }

  checkUserInRoom(userId: T_UserId): I_FullRoom | undefined {
    return this.rooms.find(
      (room) => room.users.findIndex((user) => user.userId === userId) !== -1,
    )
  }

  fullToPreviewRoom(room: I_FullRoom): I_PreviewRoom {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, messages, game, ...rest } = room
    return rest
  }

  findRoomById(roomId: T_RoomId): I_FullRoom {
    return this.rooms.find((room) => room.id === roomId)
  }

  updateCharactersWindowSettingsBars(
    roomId: T_RoomId,
    bars: T_BaseCharacterBar[],
  ): {
    settingsBars: T_BaseCharacterBar[]
    characters: I_Character[]
    masterDummies: T_BaseDummy[]
    playersDummies: T_BaseDummy[]
  } {
    const room = this.findRoomById(roomId)
    room.game.characters.settings.bars = bars

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

  updateCharactersWindowSettingsSpecials(
    roomId: T_RoomId,
    specials: T_BaseCharacterSpecial[],
  ): { settingsSpecials: T_BaseCharacterSpecial[]; characters: I_Character[] } {
    const room = this.findRoomById(roomId)
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

  updateCharactersWindowSettingsEffects(
    roomId: T_RoomId,
    effects: T_BaseCharacterEffect[],
  ): { settingsEffects: T_BaseCharacterEffect[]; characters: I_Character[] } {
    const room = this.findRoomById(roomId)
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

  createCharacterInCharactersWindow(
    roomId: T_RoomId,
    character: I_Character,
  ): I_Character {
    const room = this.findRoomById(roomId)
    room.game.characters.window.characters.push(character)
    return character
  }

  updateCharacterInCharactersWindow(
    roomId: T_RoomId,
    character: I_Character,
  ): I_Character {
    const room = this.findRoomById(roomId)
    room.game.characters.window.characters =
      room.game.characters.window.characters.map((roomCharacter) =>
        roomCharacter.id === character.id ? character : roomCharacter,
      )

    return character
  }

  updateCharacterFieldInCharactersWindow(
    roomId: T_RoomId,
    characterId: T_CharacterId,
    field: string,
    value: string | number,
    subFieldId?: string,
  ): I_Character {
    const room = this.findRoomById(roomId)
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

  removeCharacterInCharactersWindow(
    roomId: T_RoomId,
    characterId: T_CharacterId,
  ) {
    const room = this.findRoomById(roomId)
    room.game.characters.window.characters =
      room.game.characters.window.characters.filter(
        (character) => character.id !== characterId,
      )
    return characterId
  }

  createDummyInBattlefieldWindow(
    roomId: T_RoomId,
    dummy: T_BaseDummy,
    field: 'master' | 'players',
  ): T_BaseDummy {
    const room = this.findRoomById(roomId)
    if (field === 'master') {
      room.game.battlefield.window.masterDummies.push(dummy)
    }
    if (field === 'players') {
      room.game.battlefield.window.playersDummies.push(dummy)
    }
    return dummy
  }

  addDummyToFieldInBattlefieldWindow(
    roomId: T_RoomId,
    dummy: T_BaseDummy,
    field: E_Field,
  ): T_Dummy[] {
    const room = this.findRoomById(roomId)
    const fieldDummy: T_Dummy = {
      id: dummy.id,
      subId: v4(),
      barsCurrent: dummy.barsMax.map((bar) => ({ id: bar.id, value: bar.max })),
    }
    if (field === E_Field.master) {
      room.game.battlefield.window.masterField.push(fieldDummy)
      return room.game.battlefield.window.masterField
    }
    if (field === E_Field.players) {
      room.game.battlefield.window.playersField.push(fieldDummy)
      return room.game.battlefield.window.playersField
    }
  }

  removeDummiesOnFieldInBattlefieldWindow(
    roomId: T_RoomId,
    dummyId: T_DummyId,
    field: E_Field,
  ) {
    const room = this.findRoomById(roomId)

    if (field === E_Field.master) {
      room.game.battlefield.window.masterField =
        room.game.battlefield.window.masterField.filter(
          (dummy) => dummy.id !== dummyId,
        )
      return room.game.battlefield.window.masterField
    }
    if (field === E_Field.players) {
      room.game.battlefield.window.playersField =
        room.game.battlefield.window.playersField.filter(
          (dummy) => dummy.id !== dummyId,
        )
      return room.game.battlefield.window.playersField
    }
  }

  makeActionInBattlefieldWindow(
    roomId: T_RoomId,
    action: T_CharacterAction,
    actionTarget: T_DummyId | T_CharacterId,
  ): {
    characters: I_Character[]
    masterField: T_Dummy[]
    playersField: T_Dummy[]
  } {
    const room = this.findRoomById(roomId)

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

  updateDummyFieldInBattlefieldWindow(
    roomId: T_RoomId,
    dummyId: T_DummyId,
    field: string,
    value: string | number,
    battlefield: E_Field,
    subFieldId?: string,
  ): T_BaseDummy {
    const room = this.findRoomById(roomId)

    const baseDummy = room.game.battlefield.window[
      battlefield === E_Field.master ? 'masterDummies' : 'playersDummies'
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

  updateDummyInBattlefieldWindow(
    roomId: T_RoomId,
    dummy: T_BaseDummy,
    field: E_Field,
  ): T_BaseDummy {
    const room = this.findRoomById(roomId)
    room.game.battlefield.window[
      field === E_Field.master ? 'masterDummies' : 'playersDummies'
    ] = room.game.battlefield.window[
      field === E_Field.master ? 'masterDummies' : 'playersDummies'
    ].map((fieldDummy) => (fieldDummy.id === dummy.id ? dummy : fieldDummy))

    return dummy
  }

  updateDummyFieldOnFieldInBattlefieldWindow(
    roomId: T_RoomId,
    battlefield: E_Field,
    field: string,
    dummySubId: string,
    value: string,
    subFieldId: string,
  ) {
    const room = this.findRoomById(roomId)
    const dummy = room.game.battlefield.window[
      battlefield === E_Field.master ? 'masterField' : 'playersField'
    ].find((dummy) => dummy.subId === dummySubId)

    if (subFieldId) {
      dummy[field] = dummy[field].map((item: T_DummyBarsCurrent) =>
        item.id === subFieldId ? { ...item, value } : item,
      )
    }

    return room.game.battlefield.window[
      battlefield === E_Field.master ? 'masterField' : 'playersField'
    ]
  }

  removeDummyInBattlefieldWindow(
    roomId: T_RoomId,
    dummyId: T_DummyId,
    field: E_Field,
  ) {
    const room = this.findRoomById(roomId)
    room.game.battlefield.window[
      field === E_Field.master ? 'masterDummies' : 'playersDummies'
    ] = room.game.battlefield.window[
      field === E_Field.master ? 'masterDummies' : 'playersDummies'
    ].filter((dummy) => dummy.id !== dummyId)

    room.game.battlefield.window[
      field === E_Field.master ? 'masterField' : 'playersField'
    ] = room.game.battlefield.window[
      field === E_Field.master ? 'masterField' : 'playersField'
    ].filter((dummy) => dummy.id !== dummyId)

    return dummyId
  }

  removeDummyOnFieldInBattlefieldWindow(
    roomId: T_RoomId,
    dummySubId: string,
    field: E_Field,
  ) {
    const room = this.findRoomById(roomId)

    room.game.battlefield.window[
      field === E_Field.master ? 'masterField' : 'playersField'
    ] = room.game.battlefield.window[
      field === E_Field.master ? 'masterField' : 'playersField'
    ].filter((dummy) => dummy.subId !== dummySubId)

    return room.game.battlefield.window[
      field === E_Field.master ? 'masterField' : 'playersField'
    ]
  }

  getRoomMessages(roomId: T_RoomId): I_RoomMessage[] {
    return this.rooms.find((room) => room.id === roomId).messages
  }

  createMessage(
    socketId: T_SocketId,
    roomId: T_RoomId,
    text: string,
  ): I_RoomMessage {
    const room = this.findRoomById(roomId)
    const user = this.lobbyUsers.findBySocketId(socketId)

    let modifiedText = text.trim()

    const isCommand = text.startsWith('/')
    if (isCommand) modifiedText = this.createCommand(modifiedText)

    const messageId = v4()
    const message: I_RoomMessage = {
      id: messageId,
      authorId: user.id,
      author: user.nickname,
      text: modifiedText,
      command: text.trim(),
      type: isCommand ? E_RoomMessageType.command : E_RoomMessageType.custom,
    }

    room.messages.push(message)

    return message
  }

  createCommand(text: string): string {
    const dices: number = +text.split('d')[0].substring(1) || 1
    const edges: number = +text.split('d')[1] || 6
    const getRandomValue = () => Math.floor(Math.random() * edges) + 1
    const values = [...new Array(dices)].map(getRandomValue)
    return values.join(' ')
  }
}
