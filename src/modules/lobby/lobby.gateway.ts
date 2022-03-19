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

import { LobbyService } from './lobby.service'
import {
  EmitNamespace,
  EmitPayload,
  SubscribeNamespace,
  SubscriptionData,
} from 'interfaces/socket'
import { RoomId, UserId } from 'interfaces/app'
import { WsGuard } from 'guards/ws.guard'
import { WsThrottlerGuard } from 'guards/wsThrottler.guard'

@WebSocketGateway({ cors: true })
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyGateway')

  constructor(private lobby: LobbyService) {}

  // Инициализация приложения
  async afterInit() {
    this.logger.log('Init')
    this.lobby.init()
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  // Делаем пользователя онлайн, после успешной авторизации
  @UseGuards(WsGuard)
  @SubscribeMessage(SubscribeNamespace.setUserOnline)
  setUserOnline(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.setUserOnline],
  ) {
    const getLobbyPayload: EmitPayload[EmitNamespace.getLobby] = {
      lobby: this.lobby.getLobby(),
    }

    const getUserPayload: EmitPayload[EmitNamespace.getUser] = {
      user: this.lobby.setUserOnline(data.userId, client.id),
    }

    // Отправка лобби ОТПРАВИТЕЛЮ
    client.emit(EmitNamespace.getLobby, getLobbyPayload)

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(EmitNamespace.getUser, getUserPayload)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)

    const user = this.lobby.setUserOffline(client.id)

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

  // Отключаем пользователя от комнаты и делаем его оффлайн,
  // если пользователь выходит из профиля
  @SubscribeMessage(SubscribeNamespace.userLogout)
  userLogout(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.userLogout],
  ) {
    const { roomData, userData } = this.lobby.userLogout(data.roomId, client.id)

    if (roomData) {
      const { fullRoom, previewRoom } = roomData

      // Отключаем ОТПРАВИТЕЛЯ от комнаты
      client.leave(fullRoom.id)

      // Отправляем превью комнаты ВСЕМ
      const roomUpdatedPayload: EmitPayload[EmitNamespace.roomUpdated] = {
        previewRoom,
        user: userData,
      }
      this.server.emit(EmitNamespace.roomUpdated, roomUpdatedPayload)

      // Отправляем полную комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
      const inRoomUpdatePayload: EmitPayload[EmitNamespace.inRoomUpdate] = {
        fullRoom,
      }
      client.broadcast
        .to(fullRoom.id)
        .emit(EmitNamespace.inRoomUpdate, inRoomUpdatePayload)
    }

    if (userData) {
      // Отправка отключённого юзера ВСЕМ, кроме отправителя
      const userDisconnectedPayload: EmitPayload[EmitNamespace.userDisconnected] =
        {
          user: userData,
        }
      client.broadcast.emit(
        EmitNamespace.userDisconnected,
        userDisconnectedPayload,
      )
    }
  }

  // Добавление и отправка нового сообщения в лобби
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage(SubscribeNamespace.sendMessageLobby)
  sendMessageLobby(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.sendMessageLobby],
  ) {
    const getMessageLobbyPayload: EmitPayload[EmitNamespace.getMessageLobby] = {
      message: this.lobby.createLobbyMessage(client.id, data.message),
    }
    this.server.emit(EmitNamespace.getMessageLobby, getMessageLobbyPayload)
  }

  // Создание и отправка комнаты
  @SubscribeMessage(SubscribeNamespace.createRoom)
  createRoom(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.createRoom],
  ): void {
    const { roomName, roomSize, roomPassword, roomType } = data

    const { roomData, userData } = this.lobby.createRoom(
      client.id,
      roomName,
      roomSize,
      roomPassword,
      roomType,
    )

    const { fullRoom, previewRoom } = roomData

    // Отправляем превью комнаты ВСЕМ
    const roomCreatedPayload: EmitPayload[EmitNamespace.roomCreated] = {
      previewRoom,
      user: userData,
    }
    this.server.emit(EmitNamespace.roomCreated, roomCreatedPayload)

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(fullRoom.id)

    // Отправляем полную комнату ОТПРАВИТЕЛЮ\
    const getFullRoomPayload: EmitPayload[EmitNamespace.getFullRoom] = {
      fullRoom,
    }
    client.emit(EmitNamespace.getFullRoom, getFullRoomPayload)
  }

  @SubscribeMessage(SubscribeNamespace.joinRoom)
  joinRoom(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.joinRoom],
  ): void {
    const { roomId, password } = data

    const { userData, roomData } = this.lobby.joinRoom(
      client.id,
      roomId,
      password,
    )

    // Если комната переполнена или не совпадает пароль
    if (!roomData) return

    const { fullRoom, previewRoom } = roomData

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(fullRoom.id)

    // Отправляем полную комнату ОТПРАВИТЕЛЮ
    const getFullRoomPayload: EmitPayload[EmitNamespace.getFullRoom] = {
      fullRoom,
    }
    client.emit(EmitNamespace.getFullRoom, getFullRoomPayload)

    // Отправляем полную комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    const inRoomUpdatePayload: EmitPayload[EmitNamespace.inRoomUpdate] = {
      fullRoom,
    }
    client.broadcast
      .to(fullRoom.id)
      .emit(EmitNamespace.inRoomUpdate, inRoomUpdatePayload)

    // Отправляем превью комнаты ВСЕМ
    const roomUpdatedPayload: EmitPayload[EmitNamespace.roomUpdated] = {
      previewRoom,
      user: userData,
    }
    this.server.emit(EmitNamespace.roomUpdated, roomUpdatedPayload)
  }

  // Переподключение к комнате, после перезагрузки страницы
  @SubscribeMessage(SubscribeNamespace.rejoinRoom)
  rejoinRoom(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.rejoinRoom],
  ) {
    const { roomId } = data

    // Обновляем socketId юзера в комнате
    const { userData } = this.lobby.rejoinRoom(client.id, roomId)

    // Переподключаем юзера в комнату
    client.join(roomId)

    // Отправляем превью комнаты ВСЕМ
    const userRejoinInRoomPayload: EmitPayload[EmitNamespace.userRejoinInRoom] =
      {
        user: userData,
      }
    this.server.emit(EmitNamespace.userRejoinInRoom, userRejoinInRoomPayload)
  }

  // Ручной выход из комнаты
  @SubscribeMessage(SubscribeNamespace.leaveRoom)
  leaveRoom(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.leaveRoom],
  ) {
    const { userData, roomData } = this.lobby.leaveRoom(client.id, data.roomId)

    if (!roomData) return

    const { fullRoom, previewRoom } = roomData

    // Отключаем ОТПРАВИТЕЛЯ от комнаты
    client.leave(fullRoom.id)

    // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    const inRoomUpdatePayload: EmitPayload[EmitNamespace.inRoomUpdate] = {
      fullRoom,
    }
    client.broadcast
      .to(fullRoom.id)
      .emit(EmitNamespace.inRoomUpdate, inRoomUpdatePayload)

    // Отправляем комнату ВСЕМ
    const roomUpdatedPayload: EmitPayload[EmitNamespace.roomUpdated] = {
      previewRoom,
      user: userData,
    }
    this.server.emit(EmitNamespace.roomUpdated, roomUpdatedPayload)
  }
  @SubscribeMessage(SubscribeNamespace.sendMessageRoom)
  sendMessageToRoom(
    client: Socket,
    data: SubscriptionData[SubscribeNamespace.sendMessageRoom],
  ): void {
    const { message, roomId } = this.lobby.createMessageInRoom(
      client.id,
      data.roomId,
      data.message,
    )

    const getMessageRoomPayload: EmitPayload[EmitNamespace.getMessageRoom] = {
      message,
    }
    this.server
      .to(roomId)
      .emit(EmitNamespace.getMessageRoom, getMessageRoomPayload)
  }
}
