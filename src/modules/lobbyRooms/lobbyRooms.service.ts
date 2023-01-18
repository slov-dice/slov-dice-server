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
  T_CharacterBar,
  T_CharacterId,
  T_CharacterSpecial,
} from 'models/shared/game/character'
import { T_BaseDummy, T_DummyBarsMax } from 'models/shared/game/dummy'

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

  // Функции окна персонажей
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

  getRoomMessages(roomId: T_RoomId): I_RoomMessage[] {
    return this.rooms.find((room) => room.id === roomId).messages
  }

  // Создание сообщений в чате комнаты
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
