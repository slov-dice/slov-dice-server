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
import {
  CreateRoomDto,
  JoinRoomDto,
  RejoinRoomDto,
  RoomType,
} from './dto/room.dto';

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
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // Подключение пользователя к лобби
  @SubscribeMessage('set_online')
  setOnline(client: Socket, userId: number) {
    this.lobby.setUserOnline(userId, client.id);

    // Отправка лобби ОТПРАВИТЕЛЮ
    client.emit(`get_lobby`, this.lobby.state);

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    const user = this.lobby.findOneUserBySocketId(client.id);
    client.broadcast.emit(`user_connected`, user);
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Удаление клиента из списка лобби
    const disconnectedUser = this.lobby.setUserOffline(client.id);

    // Если юзер прошел авторизацию
    if (disconnectedUser) {
      // Отправка отключённого клиента ВСЕМ, кроме отправителя
      client.broadcast.emit('user_disconnected', disconnectedUser);

      const room = this.lobby.leaveRoomBySocketId(client.id);

      // Если юзер в комнате
      if (room) {
        client.leave(room.id);

        // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
        client.broadcast.to(room.id).emit('in_room_update', room);

        // Отправляем комнату ВСЕМ
        this.server.emit('room_updated', room);
      }
    }
  }

  // Отключаем пользователя от комнаты и делаем его оффлайн,
  // если пользователь выходит из профиля
  @SubscribeMessage('logout_user')
  logoutUser(client: Socket, roomId: string) {
    // Исключаем юзера из комнаты, если он в ней
    if (roomId) {
      const room = this.lobby.leaveRoom(client.id, roomId);

      // Отключаем ОТПРАВИТЕЛЯ от комнаты
      client.leave(room.id);

      // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
      client.broadcast.to(room.id).emit('in_room_update', room);

      // Отправляем комнату ВСЕМ
      this.server.emit('room_updated', room);
    }

    const disconnectedUser = this.lobby.setUserOffline(client.id);

    // Отправка отключённого юзера ВСЕМ, кроме отправителя
    client.broadcast.emit('user_disconnected', disconnectedUser);
  }

  // Добавление и отправка нового сообщения в лобби
  @SubscribeMessage('send_message_lobby')
  sendMessageLobby(client: Socket, text: string): void {
    const message = this.lobby.createMessage(client.id, text);
    this.server.emit('get_message_lobby', message);
  }

  // Создание и отправка комнаты
  @SubscribeMessage('create_room')
  createRoom(client: Socket, data: CreateRoomDto): void {
    const [name, size, password, type] = data;

    const room = this.lobby.createRoom(client.id, name, size, password, type);

    // Отправляем комнату ВСЕМ
    this.server.emit('room_created', room);

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(room.id);

    // Отправляем комнату ОТПРАВИТЕЛЮ
    client.emit('get_room', room);
  }

  @SubscribeMessage('join_room')
  joinRoom(client: Socket, data: JoinRoomDto): void {
    const [id, password] = data;

    const room = this.lobby.joinRoom(client.id, id, password);

    // Если комната переполнена или не совпадает пароль
    if (room === false) {
      console.log('ОШИБКА: комната переполнена или пароль не совпадает');
      return;
    }

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(room.id);

    // Отправляем комнату ОТПРАВИТЕЛЮ
    client.emit('get_room', room);

    // Отправляем комнату ВСЕМ кроме ОТПРАВИТЕЛЯ в комнату
    client.broadcast.to(room.id).emit('in_room_update', room);

    // Отправляем комнату ВСЕМ
    this.server.emit('room_updated', room);
  }

  // Переподключение к комнате, после перезагрузки страницы
  @SubscribeMessage('rejoin_room')
  rejoinRoom(client: Socket, data: RejoinRoomDto): void {
    const [userId, roomId] = data;

    // Переподключаем юзера в комнату
    client.join(roomId);

    // Обновляем socketId юзера в комнате
    this.lobby.rejoinRoom(client.id, userId, roomId);
  }

  // Ручной выход из комнаты
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
}
