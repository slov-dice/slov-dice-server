import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from 'modules/prisma/prisma.service';
import type { ILobby, IUser, IMessage, IRoom } from 'interfaces/app';

@Injectable()
export class LobbyService {
  state: ILobby = {
    users: [],
    rooms: [],
    messages: [],
  };

  constructor(private prisma: PrismaService) {}

  // Записываем пользователей из базы данных на сервер
  async initUsers() {
    const usersDB = await this.prisma.user.findMany();
    const usersLobby: IUser[] = usersDB.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      socketId: '',
      status: 'offline',
    }));
    this.state.users = usersLobby;
  }

  // Делаем пользователя онлайн, после успешной авторизации
  setUserOnline(userId: number, socketId: string): IUser {
    this.state.users = this.state.users.map((user) => {
      return user.id === userId
        ? { ...user, status: 'online', socketId }
        : user;
    });
    return this.findOneUserBySocketId(socketId);
  }

  // Поиск пользователя по socketId
  findOneUserBySocketId(socketId: string): IUser {
    return this.state.users.find((user) => user.socketId === socketId);
  }

  // Делаем пользователя оффлайн, если сокет потерял соединение и он в лобби
  setUserOffline(socketId: string): IUser {
    this.state.users = this.state.users.map((user) => {
      return user.socketId === socketId
        ? { ...user, status: 'offline', socketId: '' }
        : user;
    });

    return this.findOneUserBySocketId(socketId);
  }

  // Создание сообщения в лобби
  createMessage(socketId: string, text: string): IMessage {
    const author = this.findOneUserBySocketId(socketId);
    const messageId = uuidv4();
    const message = {
      id: messageId,
      authorId: author.id,
      author: author.nickname,
      text,
    };

    this.state.messages.push(message);

    return message;
  }

  // Создание комнаты в лобби
  createRoom(socketId: string, name: string): IRoom {
    const author = this.findOneUserBySocketId(socketId);
    const roomId = uuidv4();
    const room: IRoom = {
      id: roomId,
      authorId: author.id,
      name,
      size: 8,
      currentSize: 1,
      users: [author],
      messages: [],
    };

    this.state.rooms.push(room);

    return room;
  }

  // Поиск комнаты по id
  findOneRoomById(roomId: string): IRoom {
    return this.state.rooms.find((room) => room.id === roomId);
  }

  // Вход в комнату
  joinRoom(socketId: string, roomId: string): IRoom {
    const user = this.findOneUserBySocketId(socketId);
    const room = this.findOneRoomById(roomId);

    room.users.push(user);
    room.currentSize++;

    this.state.rooms = this.state.rooms.map((item) =>
      item.id === room.id ? room : item,
    );

    return room;
  }

  // Выход и комнаты
  leaveRoom(socketId: string, roomId: string): IRoom {
    const room = this.findOneRoomById(roomId);
    const userIndex = room.users.findIndex(
      (item) => item.socketId === socketId,
    );
    room.users.splice(userIndex, 1);
    room.currentSize--;

    return room;
  }

  // Создания сообщения в комнате
  createMessageInRoom(
    socketId: string,
    roomId: string,
    text: string,
  ): { message: IMessage; roomId: string } {
    const isCommand = text.startsWith('/d');
    let commandText = '';
    if (isCommand) {
      const dice: number = +text.split('d')[1];
      commandText = `[${Math.floor(Math.random() * dice) + 1}]`;
    }
    const room = this.findOneRoomById(roomId);
    const author = this.findOneUserBySocketId(socketId);
    const messageId = uuidv4();
    const message = {
      id: messageId,
      authorId: author.id,
      author: author.nickname,
      text: isCommand ? commandText : text,
    };

    room.messages.push(message);

    return { message, roomId: room.id };
  }
}