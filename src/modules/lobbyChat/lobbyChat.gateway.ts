import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { Socket, Server } from 'socket.io'

import { LobbyChatService } from './lobbyChat.service'

import { WsThrottlerGuard } from 'guards/wsThrottler.guard'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/socket/lobbyChat'

@WebSocketGateway({ cors: true })
export class LobbyChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyChatGateway')

  constructor(
    private lobbyChat: LobbyChatService,
    private lobbyUsers: LobbyUsersService,
  ) {}

  // Инициализация приложения
  async afterInit() {
    this.logger.log('Init LobbyChatGateway')
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected LobbyGateway: ${client.id}`)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  // Получение всех сообщений
  // @UseGuards(WsGuard)
  @SubscribeMessage(E_Emit.requestLobbyMessages)
  getAllMessages(client: Socket) {
    const messages = this.lobbyChat.getAllMessages()

    const payload: I_SubscriptionData[E_Subscribe.getLobbyMessages] = {
      messages,
    }

    // Отправка всех сообщений ОТПРАВИТЕЛЮ
    client.emit(E_Subscribe.getLobbyMessages, payload)
  }

  // Отправка сообщения в лобби
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage(E_Emit.sendLobbyMessage)
  sendMessageLobby(
    client: Socket,
    data: I_EmitPayload[E_Emit.sendLobbyMessage],
  ) {
    const users = this.lobbyUsers.getAll()
    const user = this.lobbyUsers.findBySocketId(client.id)
    const message = this.lobbyChat.create(user, data.text)
    const messageLobbyPayload: I_SubscriptionData[E_Subscribe.getLobbyMessage] =
      {
        message,
      }
    // Отправка сообщения ВСЕМ
    this.server.emit(E_Subscribe.getLobbyMessage, messageLobbyPayload)
  }
}
