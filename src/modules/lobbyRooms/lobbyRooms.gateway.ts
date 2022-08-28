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
import { t } from 'languages'

@WebSocketGateway({ cors: true })
export class LobbyRoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyRoomsGateway')

  constructor(
    private lobbyRooms: LobbyRoomsService, // private lobbyUsers: LobbyUsersService,
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
    const { fullRoom, previewRoom } = this.lobbyRooms.create(
      client.id,
      roomName,
      roomSize,
      roomPassword,
      roomType,
    )

    // Отправляем превью комнату всем, кроме отправителя
    client.broadcast.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всю комнату отправителю
    client.emit(E_Subscribe.getFullRoom, {
      fullRoom,
      message: t('room.success.roomCreated'),
    })
  }
}
