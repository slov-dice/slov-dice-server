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

import { LobbyUsersService } from './lobbyUsers.service'

import {
  E_Emit,
  E_Subscribe,
  I_EmitPayload,
  I_SubscriptionData,
} from 'models/socket/lobbyUsers'

@WebSocketGateway({ cors: true })
export class LobbyUsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyUsersGateway')

  constructor(private lobbyUsers: LobbyUsersService) {}

  // Инициализация пользователей из бд
  async afterInit() {
    this.logger.log('Init LobbyUsersGateway')
    await this.lobbyUsers.initUsers()
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

    const userDisconnectedPayload: I_SubscriptionData[E_Subscribe.getLobbyUser] =
      {
        user,
      }

    // Отправка отключённого клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(E_Subscribe.getLobbyUser, userDisconnectedPayload)
  }

  // Делаем пользователя онлайн и присваиваем socketId, после успешной авторизации
  @SubscribeMessage(E_Emit.setLobbyUserOnline)
  setUserOnline(
    client: Socket,
    data: I_EmitPayload[E_Emit.setLobbyUserOnline],
  ) {
    const user = this.lobbyUsers.setOnlineByUserId(data.userId, client.id)

    const payload: I_SubscriptionData[E_Subscribe.getLobbyUser] = {
      user,
    }

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(E_Subscribe.getLobbyUser, payload)
  }

  // Получение всех пользователей
  @SubscribeMessage(E_Emit.requestLobbyUsers)
  requestAllUsers(client: Socket) {
    const users = this.lobbyUsers.getAll()
    const payload: I_SubscriptionData[E_Subscribe.getLobbyUsers] = {
      users,
    }

    // Отправляем список пользователей в лобби ОТПРАВИТЕЛЮ
    client.emit(E_Subscribe.getLobbyUsers, payload)
  }

  @SubscribeMessage(E_Emit.logoutLobbyUser)
  logoutLobbyUser(client: Socket) {
    const user = this.lobbyUsers.logout(client.id)

    const payload: I_SubscriptionData[E_Subscribe.getLobbyUser] = {
      user,
    }

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(E_Subscribe.getLobbyUser, payload)
  }

  // Отключаем пользователя от комнаты и делаем его оффлайн,
  // если пользователь выходит из профиля.
  // @SubscribeMessage(SubscribeNamespace.requestUserLogout)
  // requestUserLogout(
  //   client: Socket,
  //   data: SubscriptionData[SubscribeNamespace.requestUserLogout],
  // ) {
  //   if (data.roomId) {
  //     // TODO: исключаем пользователя из комнаты
  //   }
  //   const user = this.lobbyUsers.setOfflineBySocketId(client.id)

  //   // Если пользователь не найден
  //   if (!user) return

  //   const getUserLobbyPayload: EmitPayload[EmitNamespace.getUserLobby] = {
  //     user,
  //   }

  //   // Все пользователи, кроме отправителя получают отключенного пользователя
  //   client.broadcast.emit(EmitNamespace.getUserLobby, getUserLobbyPayload)
  // }

  // TODO: новый пользователь зарегистрировался, нужно оповестить всех пользователей
}
