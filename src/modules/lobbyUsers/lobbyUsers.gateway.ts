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
import {
  E_Subscribe as E_LRSubscribe,
  I_SubscriptionData as I_LRSubscriptionData,
} from 'models/socket/lobbyRooms'

import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'
import { t } from 'languages'
import { E_StatusServerMessage, I_LobbyUser } from 'models/app'

@WebSocketGateway({ cors: true })
export class LobbyUsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyUsersGateway')

  constructor(
    private lobbyRooms: LobbyRoomsService,
    private lobbyUsers: LobbyUsersService,
  ) {}

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

    const payload: I_SubscriptionData[E_Subscribe.getLobbyUser] = {
      user,
    }

    // Отправка отключённого клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(E_Subscribe.getLobbyUser, payload)
  }

  // Делаем пользователя онлайн и присваиваем socketId, после успешной авторизации
  @SubscribeMessage(E_Emit.setLobbyUserOnline)
  setUserOnline(
    client: Socket,
    { userId }: I_EmitPayload[E_Emit.setLobbyUserOnline],
  ) {
    const fullRoom = this.lobbyRooms.checkUserInRoom(userId)
    let user: I_LobbyUser

    // Если пользователь находился в комнате
    if (fullRoom) {
      this.lobbyRooms.rejoin(fullRoom, userId, client.id)
      user = this.lobbyUsers.setInRoomByUserId(userId, client.id)
      const previewRoom = this.lobbyRooms.fullToPreviewRoom(fullRoom)

      // Подключаем пользователя к сокет комнате
      client.join(fullRoom.id)

      client.emit(E_LRSubscribe.getFullRoom, { fullRoom })

      // Отправляем обновлённую полную комнату ВСЕМ в комнате
      client.to(fullRoom.id).emit(E_LRSubscribe.getFullRoom, { fullRoom })

      // Отправляем всем обновлённое превью комнаты
      this.server.emit(E_LRSubscribe.getPreviewRoom, { previewRoom })
    } else {
      user = this.lobbyUsers.setOnlineByUserId(userId, client.id)
    }

    // Отправка обновлённого клиента ВСЕМ
    this.server.emit(E_Subscribe.getLobbyUser, { user })
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

  // Если пользователь выходит из профиля
  @SubscribeMessage(E_Emit.logoutLobbyUser)
  logoutLobbyUser(client: Socket, data: I_EmitPayload[E_Emit.logoutLobbyUser]) {
    const user = this.lobbyUsers.logout(client.id)
    this.server.emit(E_Subscribe.getLobbyUser, { user })

    // Если пользователь находится в комнате
    if (data.roomId) {
      const { fullRoom, previewRoom } = this.lobbyRooms.leave(
        client.id,
        data.roomId,
      )
      // Отправляем обновлённую полную комнату ВСЕМ в комнате
      const toRoomPayload: I_LRSubscriptionData[E_LRSubscribe.getFullRoom] = {
        fullRoom: fullRoom,
        message: t('room.info.userLeft'),
        status: E_StatusServerMessage.info,
      }
      client.to(fullRoom.id).emit(E_LRSubscribe.getFullRoom, toRoomPayload)

      // Отправляем всем обновлённое превью комнаты
      this.server.emit(E_LRSubscribe.getPreviewRoom, { previewRoom })
    }
  }

  // TODO: новый пользователь зарегистрировался, нужно оповестить всех пользователей
}
