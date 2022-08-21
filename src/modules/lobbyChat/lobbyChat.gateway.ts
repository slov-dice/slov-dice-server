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
import { WsGuard } from 'guards/ws.guard'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
// import {
//   EmitNamespace,
//   EmitPayload,
//   SubscribeNamespace,
//   SubscriptionData,
// } from 'models/socket'

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
  // @SubscribeMessage(SubscribeNamespace.requestAllMessagesLobby)
  // getAllMessages(
  //   client: Socket,
  //   _: SubscriptionData[SubscribeNamespace.requestAllMessagesLobby],
  // ) {
  //   const chat = this.lobbyChat.getAll()

  //   const getAllMessagesLobbyPayload: EmitPayload[EmitNamespace.getAllMessagesLobby] =
  //     {
  //       chat,
  //     }

  //   // Отправка всех сообщений в лобби ОТПРАВИТЕЛЮ
  //   client.emit(EmitNamespace.getAllMessagesLobby, getAllMessagesLobbyPayload)
  // }

  // // Отправка сообщения в лобби
  // @UseGuards(WsThrottlerGuard)
  // @SubscribeMessage(SubscribeNamespace.sendMessageLobby)
  // sendMessageLobby(
  //   client: Socket,
  //   data: SubscriptionData[SubscribeNamespace.sendMessageLobby],
  // ) {
  //   const user = this.lobbyUsers.findBySocketId(client.id)
  //   const message = this.lobbyChat.create(user, data.text)
  //   const messageLobbyPayload: EmitPayload[EmitNamespace.getMessageLobby] = {
  //     message,
  //   }
  //   // Отправка сообщения ВСЕМ
  //   this.server.emit(EmitNamespace.getMessageLobby, messageLobbyPayload)
  // }
}
