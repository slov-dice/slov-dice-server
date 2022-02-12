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

import { EmitNamespace, SubscribeNamespace } from './types/socket'
import { CreateRoomDto, JoinRoomDto, RejoinRoomDto } from './dto/room.dto'
import { LobbyService } from './lobby.service'
import { RoomId, UserId } from 'interfaces/app'

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

  @SubscribeMessage(SubscribeNamespace.setUserOnline)
  setUserOnline(client: Socket, userId: UserId) {
    const user = this.lobby.setUserOnline(userId, client.id)
    const lobby = this.lobby.getLobby()

    // Отправка лобби ОТПРАВИТЕЛЮ
    client.emit(EmitNamespace.getLobby, lobby)

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(EmitNamespace.getUser, user)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)

    const user = this.lobby.setUserOffline(client.id)

    // Если пользователь не найден
    if (!user) return

    // Отправка отключённого клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(EmitNamespace.userDisconnected, user)
  }

  // Отключаем пользователя от комнаты и делаем его оффлайн,
  // если пользователь выходит из профиля
  @SubscribeMessage(SubscribeNamespace.userLogout)
  userLogout(client: Socket, roomId: RoomId) {
    const { roomData, userData } = this.lobby.userLogout(roomId, client.id)

    if (roomData) {
      const { fullRoom, previewRoom } = roomData

      // Отключаем ОТПРАВИТЕЛЯ от комнаты
      client.leave(fullRoom.id)

      // Отправляем превью комнаты ВСЕМ
      this.server.emit(EmitNamespace.roomUpdated, previewRoom)

      // Отправляем полную комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
      client.broadcast
        .to(fullRoom.id)
        .emit(EmitNamespace.inRoomUpdate, fullRoom)
    }

    if (userData) {
      // Отправка отключённого юзера ВСЕМ, кроме отправителя
      client.broadcast.emit(EmitNamespace.userDisconnected, userData)
    }
  }

  // Добавление и отправка нового сообщения в лобби
  @SubscribeMessage(SubscribeNamespace.sendMessageLobby)
  sendMessageLobby(client: Socket, text: string) {
    const message = this.lobby.createLobbyMessage(client.id, text)
    this.server.emit(EmitNamespace.getMessageLobby, message)
  }

  // Создание и отправка комнаты
  @SubscribeMessage(SubscribeNamespace.createRoom)
  createRoom(client: Socket, data: CreateRoomDto): void {
    const [name, size, password, type] = data

    const { roomData, userData } = this.lobby.createRoom(
      client.id,
      name,
      size,
      password,
      type,
    )

    const { fullRoom, previewRoom } = roomData

    // Отправляем превью комнаты ВСЕМ
    this.server.emit(EmitNamespace.roomCreated, {
      previewRoom,
      user: userData,
    })

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(fullRoom.id)

    // Отправляем полную комнату ОТПРАВИТЕЛЮ
    client.emit(EmitNamespace.getFullRoom, fullRoom)
  }

  @SubscribeMessage(SubscribeNamespace.joinRoom)
  joinRoom(client: Socket, data: JoinRoomDto): void {
    const [id, password] = data

    const { userData, roomData } = this.lobby.joinRoom(client.id, id, password)

    // Если комната переполнена или не совпадает пароль
    if (!roomData) return

    const { fullRoom, previewRoom } = roomData

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(fullRoom.id)

    // Отправляем полную комнату ОТПРАВИТЕЛЮ
    client.emit(EmitNamespace.getFullRoom, fullRoom)

    // Отправляем полную комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    client.broadcast.to(fullRoom.id).emit(EmitNamespace.inRoomUpdate, fullRoom)

    // Отправляем превью комнаты ВСЕМ
    this.server.emit(EmitNamespace.roomUpdated, {
      previewRoom,
      user: userData,
    })
  }

  // Переподключение к комнате, после перезагрузки страницы
  @SubscribeMessage(SubscribeNamespace.rejoinRoom)
  rejoinRoom(client: Socket, data: RejoinRoomDto) {
    const [userId, roomId] = data

    // Обновляем socketId юзера в комнате
    const { userData, roomData } = this.lobby.rejoinRoom(client.id, roomId)

    // Переподключаем юзера в комнату
    client.join(roomId)

    // Отправляем превью комнаты ВСЕМ
    this.server.emit(EmitNamespace.userRejoinInRoom, { user: userData })
  }

  // Ручной выход из комнаты
  @SubscribeMessage(SubscribeNamespace.leaveRoom)
  leaveRoom(client: Socket, roomId: RoomId): void {
    const { userData, roomData } = this.lobby.leaveRoom(client.id, roomId)

    if (!roomData) return

    const { fullRoom, previewRoom } = roomData

    // Отключаем ОТПРАВИТЕЛЯ от комнаты
    client.leave(fullRoom.id)

    // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    client.broadcast.to(fullRoom.id).emit(EmitNamespace.inRoomUpdate, fullRoom)

    // Отправляем комнату ВСЕМ
    this.server.emit(EmitNamespace.roomUpdated, {
      previewRoom,
      user: userData,
    })
  }
  @SubscribeMessage(SubscribeNamespace.sendMessageRoom)
  sendMessageToRoom(
    client: Socket,
    data: { roomId: RoomId; text: string },
  ): void {
    const { message, roomId } = this.lobby.createMessageInRoom(
      client.id,
      data.roomId,
      data.text,
    )

    this.server.to(roomId).emit(EmitNamespace.getMessageRoom, message)
  }
}
