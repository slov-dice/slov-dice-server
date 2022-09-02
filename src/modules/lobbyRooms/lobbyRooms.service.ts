import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

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
} from 'models/app'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import { E_Subscribe, I_SubscriptionData } from 'models/socket/lobbyRooms'
import { t } from 'languages'

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
    const { password, messages, ...rest } = room
    return rest
  }

  findRoomById(id: T_RoomId): I_FullRoom {
    return this.rooms.find((room) => room.id === id)
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
    return `[${values.join(' ')}]`
  }
}
