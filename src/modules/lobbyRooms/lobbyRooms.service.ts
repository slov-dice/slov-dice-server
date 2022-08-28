import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import { E_RoomType, I_FullRoom, I_PreviewRoom, T_SocketId } from 'models/app'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'

interface I_RoomResponse {
  fullRoom: I_FullRoom
  previewRoom: I_PreviewRoom
}

@Injectable()
export class LobbyRoomsService {
  constructor(private lobbyUsers: LobbyUsersService) {}

  rooms: I_FullRoom[] = [
    {
      id: '1',
      authorId: 222,
      name: 'TEST PUBLIC',
      currentSize: 1,
      messages: [],
      password: '',
      size: 6,
      type: E_RoomType.public,
      users: [{ 12: '1212' }],
    },
    {
      id: '2',
      authorId: 222,
      name: 'TEST PRIVATE',
      currentSize: 1,
      messages: [],
      password: '',
      size: 6,
      type: E_RoomType.private,
      users: [{ 12: '1212' }],
    },
  ]

  getAllPreviewRooms(): I_PreviewRoom[] {
    return this.rooms.map((room): I_PreviewRoom => this.getPreviewRoom(room))
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

    this.rooms.push(room)

    return { fullRoom: room, previewRoom: this.getPreviewRoom(room) }
  }

  getPreviewRoom(room: I_FullRoom): I_PreviewRoom {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, messages, ...rest } = room
    return rest
  }
}
