import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { IProfile, ILobby, IUser, IArea } from './interfaces/app';

@WebSocketGateway()
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LobbyGateway');

  lobbyState: ILobby = {
    users: [],
    messages: [],
    areas: [],
  };

  // Добавление и отправка нового сообщения
  @SubscribeMessage('SEND_MESSAGE')
  handleMessage(client: Socket, text: string): void {
    const author = this.lobbyState.users.find((user) => user.id === client.id);
    const messageId = uuidv4();
    const message = {
      id: messageId,
      authorId: author.id,
      author: author.nickname,
      text,
    };
    this.lobbyState.messages.push(message);
    this.server.emit('GET_MESSAGE', message);
  }

  // Создание и отправка комнаты
  @SubscribeMessage('CREATE_AREA')
  createRoom(client: Socket, name: string): void {
    const author = this.lobbyState.users.find((user) => user.id === client.id);
    const areaId = uuidv4();
    const newArea: IArea = {
      id: areaId,
      authorId: author.id,
      name,
      size: 8,
      currentSize: 1,
      users: [author],
    };
    this.lobbyState.areas.push(newArea);
    this.server.emit('AREA_CREATED', newArea);
    client.join(newArea.id);
    client.emit('GET_AREA', newArea);
  }

  @SubscribeMessage('JOIN_AREA')
  joinArea(client: Socket, areaId: string): void {
    const user = this.lobbyState.users.find((user) => user.id === client.id);
    const area = this.lobbyState.areas.find((area) => area.id === areaId);
    area.users.push(user);
    area.currentSize++;
    client.join(area.id);
    client.emit('GET_AREA', area);
    client.broadcast.to(area.id).emit('IN_AREA_UPDATED', area);
    this.server.emit('AREA_UPDATED', area);
  }

  @SubscribeMessage('LEAVE_AREA')
  leaveArea(client: Socket, areaId: string): void {
    const userIndex = this.lobbyState.users.findIndex(
      (user) => user.id === client.id,
    );
    const area = this.lobbyState.areas.find((area) => area.id === areaId);
    area.users.splice(userIndex, 1);
    area.currentSize--;
    client.leave(area.id);

    client.broadcast.to(area.id).emit('IN_AREA_UPDATED', area);
    this.server.emit('AREA_UPDATED', area);
  }
  // Запуск сервера
  afterInit(server: Server) {
    this.logger.log('Init');
  }

  // Отключение одного из сокетов
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userIndex = this.lobbyState.users.findIndex(
      (user) => user.id === client.id,
    );

    // Отправка отключённого клиента ВСЕМ
    client.broadcast.emit(
      `USER_DISCONNECTED`,
      this.lobbyState.users[userIndex].id,
    );

    // Удаление отключенного клиента
    this.lobbyState.users.splice(userIndex, 1);
  }

  // Подключение нового сокета
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);

    // Создание нового клиента
    const newUserId = client.id;
    const newUser: IUser = {
      id: newUserId,
      nickname: `babyBoy-${newUserId[0] + newUserId[1] + newUserId[2]}`,
      status: 'Online',
    };
    const newProfile: IProfile = {
      ...newUser,
      friends: [],
      inArea: false,
    };

    // Добавляем нового клиента
    this.lobbyState.users.push(newUser);

    // Отправка нового клиента ВСЕМ, кроме ОТПРАВИТЕЛЯ
    client.broadcast.emit(`USER_CONNECTED`, newUser);

    // Отправка профиля и данных сервера ОТПРАВИТЕЛЮ
    client.emit(`GET_PROFILE`, newProfile, this.lobbyState);
  }
}
