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

import { LobbyUsersService } from './lobbyUsers.service'

import { WsGuard } from 'guards/ws.guard'
import { UsersService } from 'modules/users/users.service'
import {
  EmitNamespace,
  EmitPayload,
  SubscribeNamespace,
  SubscriptionData,
} from 'models/socket'

@WebSocketGateway({ cors: true })
export class LobbyUsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyUsersGateway')

  constructor(
    private lobbyUsers: LobbyUsersService,
    private usersService: UsersService,
  ) {}

  // Инициализация пользователей из бд
  async afterInit() {
    this.logger.log('Init LobbyUsersGateway')
    const usersDB = await this.usersService.getAll()
    this.lobbyUsers.initUsers(usersDB)
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected LobbyUsersGateway: ${client.id}`)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)

    const user = this.lobbyUsers.setOfflineBySocketId(client.id)

    // Если пользователь не найден
    if (!user) return

    const userDisconnectedPayload: EmitPayload[EmitNamespace.userDisconnected] =
      {
        user,
      }

    // Отправка отключённого клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(
      EmitNamespace.userDisconnected,
      userDisconnectedPayload,
    )
  }

  // Делаем пользователя онлайн и присваиваем socketId, после успешной авторизации
  @UseGuards(WsGuard)
  @SubscribeMessage(SubscribeNamespace.setUserOnline)
  setUserOnline(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.setUserOnline],
  ) {
    const user = this.lobbyUsers.setOnlineByUserId(data.userId, client.id)

    const getUserLobbyPayload: EmitPayload[EmitNamespace.getUserLobby] = {
      user,
    }

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(EmitNamespace.getUserLobby, getUserLobbyPayload)
  }

  // Получение всех пользователей
  @UseGuards(WsGuard)
  @SubscribeMessage(SubscribeNamespace.requestAllUsersLobby)
  requestAllUsers(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.requestAllUsersLobby],
  ) {
    const users = this.lobbyUsers.getAll()
    const getAllUsersLobbyPayload: EmitPayload[EmitNamespace.getAllUsersLobby] =
      {
        users,
      }

    // Отправляем список пользователей в лобби ОТПРАВИТЕЛЮ
    client.emit(EmitNamespace.getAllUsersLobby, getAllUsersLobbyPayload)
  }

  // Отключаем пользователя от комнаты и делаем его оффлайн,
  // если пользователь выходит из профиля.
  @SubscribeMessage(SubscribeNamespace.requestUserLogout)
  requestUserLogout(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.requestUserLogout],
  ) {
    if (data.roomId) {
      // TODO: исключаем пользователя из комнаты
    }
    const user = this.lobbyUsers.setOfflineBySocketId(client.id)

    // Если пользователь не найден
    if (!user) return

    const getUserLobbyPayload: EmitPayload[EmitNamespace.getUserLobby] = {
      user,
    }

    // Все пользователи, кроме отправителя получают отключенного пользователя
    client.broadcast.emit(EmitNamespace.getUserLobby, getUserLobbyPayload)
  }

  // TODO: новый пользователь зарегистрировался, нужно оповестить всех пользователей
}
