import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'

import { ChatService } from './chat.service'

import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server

  constructor(private chatService: ChatService) {}

  // Создание сообщений в чате комнаты
  @SubscribeMessage(E_Emit.sendMessageRoom)
  sendMessageToRoom(
    client: Socket,
    { roomId, text }: I_EmitPayload[E_Emit.sendMessageRoom],
  ): void {
    const message = this.chatService.createMessage({
      socketId: client.id,
      roomId,
      text,
    })

    const response: I_SubscriptionData[E_Subscribe.getRoomMessage] = {
      message,
    }

    this.server.to(roomId).emit(E_Subscribe.getRoomMessage, response)
  }

  // Получение сообщений чата комнаты
  @SubscribeMessage(E_Emit.requestRoomMessages)
  requestRoomMessages(
    _: Socket,
    { roomId }: I_EmitPayload[E_Emit.requestRoomMessages],
  ): void {
    const messages = this.chatService.getRoomMessages({ roomId })
    const response: I_SubscriptionData[E_Subscribe.getRoomChat] = {
      messages,
    }

    this.server.to(roomId).emit(E_Subscribe.getRoomChat, response)
  }
}
