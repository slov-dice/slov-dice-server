import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

import { LobbyService } from './lobby.service';

@WebSocketGateway({ cors: true })
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LobbyGateway');

  constructor(private lobby: LobbyService) {}

  async afterInit() {
    this.logger.log('Init');
    this.lobby.initUsers();
  }

  // Подключение нового сокета
  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // Подключение пользователя к лобби
  @SubscribeMessage('set_online')
  setOnline(client: Socket, userId: number) {
    const user = this.lobby.setUserOnline(userId, client.id);

    // Отправка лобби ОТПРАВИТЕЛЮ
    client.emit(`get_lobby`, this.lobby.state);

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(`user_connected`, user);
  }

  // Отключение сокета
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Удаление клиента из списка лобби
    const disconnectedUser = this.lobby.setUserOffline(client.id);

    // Отправка отключённого клиента ВСЕМ, кроме отправителя
    if (disconnectedUser) {
      client.broadcast.emit('user_disconnected', disconnectedUser);
    }
  }

  // Добавление и отправка нового сообщения в лобби
  @SubscribeMessage('send_message_lobby')
  handleMessageLobby(client: Socket, text: string): void {
    const message = this.lobby.createMessage(client.id, text);
    this.server.emit('get_message_lobby', message);
  }

  // Создание и отправка комнаты
  @SubscribeMessage('create_room')
  createRoom(client: Socket, name: string): void {
    const room = this.lobby.createRoom(client.id, name);

    // Отправляем комнату ВСЕМ
    this.server.emit('room_created', room);

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(room.id);

    // Отправляем комнату ОТПРАВИТЕЛЮ
    client.emit('get_room', room);
  }

  @SubscribeMessage('join_room')
  joinRoom(client: Socket, areaId: string): void {
    const room = this.lobby.joinRoom(client.id, areaId);

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(room.id);

    // Отправляем комнату ОТПРАВИТЕЛЮ
    client.emit('get_room', room);

    // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    client.broadcast.to(room.id).emit('in_room_update', room);

    // Отправляем комнату ВСЕМ
    this.server.emit('room_updated', room);
  }

  @SubscribeMessage('leave_room')
  leaveRoom(client: Socket, roomId: string): void {
    const room = this.lobby.leaveRoom(client.id, roomId);

    // Отключаем ОТПРАВИТЕЛЯ от комнаты
    client.leave(room.id);

    // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    client.broadcast.to(room.id).emit('in_room_update', room);

    // Отправляем комнату ВСЕМ
    this.server.emit('room_updated', room);
  }
  @SubscribeMessage('send_message_room')
  sendMessageToRoom(
    client: Socket,
    data: { roomId: string; text: string },
  ): void {
    const { message, roomId } = this.lobby.createMessageInRoom(
      client.id,
      data.roomId,
      data.text,
    );

    this.server.to(roomId).emit('get_message_room', message);
  }

  @SubscribeMessage('check_auth')
  checkAuth(client: Socket, token: string) {
    console.log('check_auth', token);
    client.emit('get_profile', '123');
  }
}
