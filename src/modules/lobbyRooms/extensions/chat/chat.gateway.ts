import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Socket, Server } from 'socket.io'

import { ChatService } from './chat.service'

import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'

@WebSocketGateway({ cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('ChatGateway')

  constructor(private chatService: ChatService) {}

  // Инициализация приложения
  async afterInit() {
    this.logger.log('Init ChatGateway')
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected ChatGateway: ${client.id}`)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

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
