import { Injectable } from '@nestjs/common'

import { CommandsService } from './commands.service'
import { I_CreateMessage, I_GetRoomMessages } from './models/service.model'

import { E_RoomMessageType, I_RoomMessage } from 'models/shared/app'
import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import { v4 } from 'uuid'

@Injectable()
export class ChatService {
  constructor(
    private lobbyRooms: LobbyRoomsService,
    private lobbyUsers: LobbyUsersService,
    private commandsService: CommandsService,
  ) {}

  createMessage({ roomId, socketId, text }: I_CreateMessage): I_RoomMessage {
    const room = this.lobbyRooms.findRoomById(roomId)
    const user = this.lobbyUsers.findBySocketId(socketId)

    let modifiedText = text.trim()

    const isCommand = text.startsWith('/')
    if (isCommand)
      modifiedText = this.commandsService.createCommand(modifiedText)

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

  getRoomMessages({ roomId }: I_GetRoomMessages): I_RoomMessage[] {
    const room = this.lobbyRooms.findRoomById(roomId)
    return room.messages
  }
}
