import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import { lobbyRoomGameInstance } from './data'

import {
  E_RoomType,
  E_StatusServerMessage,
  I_FullRoom,
  I_LobbyUser,
  I_PreviewRoom,
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
import { T_GameSave } from 'models/shared/game/save'

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

  loadGame(save: T_GameSave, roomId: string) {
    const room = this.findRoomById(roomId)
    room.messages = save.messages
    room.game = save.game

    return { roomGame: room.game, roomMessages: room.messages }
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
}
