import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import {
  E_RoomType,
  E_StatusServerMessage,
  I_FullRoom,
  I_PreviewRoom,
  T_RoomId,
  T_SocketId,
} from 'models/app'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import { E_Subscribe, I_SubscriptionData } from 'models/socket/lobbyRooms'
import { t } from 'languages'

interface I_RoomResponse {
  fullRoom: I_FullRoom
  previewRoom: I_PreviewRoom
}

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
  ): I_RoomResponse {
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
      users: [{ [user.id]: user.socketId }],
      messages: [],
    }

    this.lobbyUsers.setInRoomBySocketId(socketId)
    this.rooms.push(room)

    return { fullRoom: room, previewRoom: this.fullToPreviewRoom(room) }
  }

  join(
    socketId: T_SocketId,
    roomId: T_RoomId,
    password: string,
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
    room.users.push({ [user.id]: socketId })
    room.currentSize++

    return {
      fullRoom: room,
      message: t('room.success.join'),
      status: E_StatusServerMessage.success,
    }
  }

  fullToPreviewRoom(room: I_FullRoom): I_PreviewRoom {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, messages, ...rest } = room
    return rest
  }

  findRoomById(id: T_RoomId): I_FullRoom {
    return this.rooms.find((room) => room.id === id)
  }
}
