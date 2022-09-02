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

import { LobbyRoomsService } from './lobbyRooms.service'

import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/socket/lobbyRooms'
import { E_Subscribe as E_LUSubscribe } from 'models/socket/lobbyUsers'
import { t } from 'languages'
import { E_StatusServerMessage } from 'models/app'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'

@WebSocketGateway({ cors: true })
export class LobbyRoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyRoomsGateway')

  constructor(
    private lobbyRooms: LobbyRoomsService,
    private lobbyUsers: LobbyUsersService,
  ) {}

  // Инициализация приложения
  async afterInit() {
    this.logger.log('Init LobbyRoomsGateway')
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected LobbyRoomsGateway: ${client.id}`)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  // Получение всех комнат
  @SubscribeMessage(E_Emit.requestPreviewRooms)
  requestRooms(client: Socket) {
    const rooms = this.lobbyRooms.getAllPreviewRooms()
    const payload: I_SubscriptionData[E_Subscribe.getPreviewRooms] = {
      previewRooms: rooms,
    }

    // Отправляем список превью комнат в лобби ОТПРАВИТЕЛЮ
    client.emit(E_Subscribe.getPreviewRooms, payload)
  }

  // Создание комнаты
  @SubscribeMessage(E_Emit.createRoom)
  createRoom(client: Socket, data: I_EmitPayload[E_Emit.createRoom]) {
    const { roomName, roomSize, roomPassword, roomType } = data

    // Создаём комнату, добавляем туда создателя
    const { fullRoom, previewRoom, user } = this.lobbyRooms.create(
      client.id,
      roomName,
      roomSize,
      roomPassword,
      roomType,
    )

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(fullRoom.id)

    // Отправляем превью комнату всем, кроме отправителя
    client.broadcast.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всю комнату отправителю
    client.emit(E_Subscribe.getFullRoom, {
      fullRoom,
      message: t('room.success.created'),
      status: E_StatusServerMessage.success,
    })

    // Отправляем всем обновлённого пользователя
    this.server.emit(E_LUSubscribe.getLobbyUser, { user })
  }

  // Вход пользователя в комнату
  @SubscribeMessage(E_Emit.joinRoom)
  joinRoom(client: Socket, data: I_EmitPayload[E_Emit.joinRoom]) {
    const { roomId, password } = data
    const clientPayload = this.lobbyRooms.join(client.id, roomId, password)

    if (!clientPayload.fullRoom) {
      client.emit(E_Subscribe.getFullRoom, clientPayload)
      return
    }

    // Подключаем пользователя к сокет комнате
    client.join(clientPayload.fullRoom.id)
    client.emit(E_Subscribe.getFullRoom, clientPayload)

    // Отправляем обновлённую полную комнату ВСЕМ в комнате
    const toPayload: I_SubscriptionData[E_Subscribe.getFullRoom] = {
      fullRoom: clientPayload.fullRoom,
      message: t('room.info.userJoin'),
      status: E_StatusServerMessage.info,
    }
    client
      .to(clientPayload.fullRoom.id)
      .emit(E_Subscribe.getFullRoom, toPayload)

    // Отправляем всем обновлённое превью комнаты
    const previewRoom = this.lobbyRooms.fullToPreviewRoom(
      clientPayload.fullRoom,
    )
    this.server.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всем обновлённого пользователя
    const user = this.lobbyUsers.findBySocketId(client.id)
    this.server.emit(E_LUSubscribe.getLobbyUser, { user })
  }

  // Ручной выход из комнаты
  @SubscribeMessage(E_Emit.leaveRoom)
  leaveRoom(client: Socket, data: I_EmitPayload[E_Emit.leaveRoom]) {
    const { fullRoom, previewRoom } = this.lobbyRooms.leave(
      client.id,
      data.roomId,
    )

    const user = this.lobbyUsers.setOnlineBySocketId(client.id)

    // Отключаем пользователя от сокет комнаты
    client.leave(fullRoom.id)

    // Отправляем обновлённую полную комнату ВСЕМ в комнате
    const toRoomPayload: I_SubscriptionData[E_Subscribe.getFullRoom] = {
      fullRoom: fullRoom,
      message: t('room.info.userLeft'),
      status: E_StatusServerMessage.info,
    }
    client.to(fullRoom.id).emit(E_Subscribe.getFullRoom, toRoomPayload)

    // Отправляем всем обновлённое превью комнаты
    this.server.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всем обновлённого пользователя
    this.server.emit(E_LUSubscribe.getLobbyUser, { user })
  }

  @SubscribeMessage(E_Emit.sendMessageRoom)
  sendMessageToRoom(
    client: Socket,
    { roomId, text }: I_EmitPayload[E_Emit.sendMessageRoom],
  ): void {
    const message = this.lobbyRooms.createMessage(client.id, roomId, text)

    this.server.to(roomId).emit(E_Subscribe.getRoomMessage, { message })
  }
}
