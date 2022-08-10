import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

import {
  FullRoom,
  LobbyUser,
  PreviewRoom,
  RoomChat,
  T_RoomId,
  RoomMessageTypeEnum,
  RoomTypeEnum,
  RoomUser,
  T_SocketId,
} from 'models/app'

export interface RoomResponse {
  fullRoom: FullRoom
  previewRoom: PreviewRoom
}

@Injectable()
export class LobbyRoomsService {
  rooms: FullRoom[] = []

  getAllPreview(): PreviewRoom[] {
    return this.rooms.map((room): PreviewRoom => this.getPreviewRoom(room))
  }

  create(
    user: LobbyUser,
    name: string,
    size: number,
    password: string,
    type: RoomTypeEnum,
  ): RoomResponse {
    const roomId = uuidv4()

    const room: FullRoom = {
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

    this.rooms.push(room)

    return { fullRoom: room, previewRoom: this.getPreviewRoom(room) }
  }

  join(
    user: LobbyUser,
    roomId: T_RoomId,
    roomPassword: string,
  ): RoomResponse | false {
    const roomIndex = this.findRoomIndexByRoomId(roomId)
    const room = this.rooms[roomIndex]

    // Если комната переполнена
    if (room.currentSize >= room.size) return false

    // Если пароль не совпадает
    if (room.password !== roomPassword && room.type === RoomTypeEnum.private)
      return false

    room.users.push({ [user.id]: user.socketId })
    room.currentSize++

    return { fullRoom: room, previewRoom: this.getPreviewRoom(room) }
  }

  rejoin(lobbyUser: LobbyUser, roomId: T_RoomId): RoomResponse | false {
    const roomIndex = this.findRoomIndexByRoomId(roomId)

    // Если комната не существует
    if (roomIndex <= -1) return false

    // Меняем socketId
    const room = this.rooms[roomIndex]
    room.users = room.users.map((user) =>
      this.getUserId(user) === lobbyUser.id
        ? { [lobbyUser.id]: lobbyUser.socketId }
        : user,
    )

    return { fullRoom: room, previewRoom: this.getPreviewRoom(room) }
  }

  removeUser(roomId: T_RoomId, socketId: T_SocketId): RoomResponse {
    const roomIndex = this.findRoomIndexByRoomId(roomId)
    const room = this.rooms[roomIndex]

    // Удаляем пользователя
    room.users = room.users.filter((user) => user !== socketId)

    // Уменьшаем количество участников
    room.currentSize--

    // Если выходит последний пользователь, то удаляем комнату
    if (room.currentSize <= 0) {
      this.rooms = this.rooms.filter((room) => room.id !== roomId)
    }

    return { fullRoom: room, previewRoom: this.getPreviewRoom(room) }
  }

  createMessage(user: LobbyUser, roomId: T_RoomId, text: string): RoomChat {
    const roomIndex = this.findRoomIndexByRoomId(roomId)
    const room = this.rooms[roomIndex]

    let modifiedText = text.trim()

    const isCommand = text.startsWith('/')
    if (isCommand) modifiedText = this.createCommand(modifiedText)

    const messageId = uuidv4()
    const message: RoomChat = {
      id: messageId,
      authorId: user.id,
      author: user.nickname,
      text: modifiedText,
      type: isCommand
        ? RoomMessageTypeEnum.command
        : RoomMessageTypeEnum.custom,
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

  getPreviewRoom(room: FullRoom): PreviewRoom {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, messages, ...rest } = room
    return rest
  }

  findRoomIndexByRoomId(roomId: T_RoomId): number {
    return this.rooms.findIndex((room) => room.id === roomId)
  }

  getUserId(user: RoomUser): number {
    return +Object.keys(user)[0]
  }
}
