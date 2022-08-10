import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'

import { LobbyUsersService } from './lobbyUsers.service'
import { LobbyRoomsService, RoomResponse } from './lobbyRooms.service'
import { LobbyChatService } from './lobbyChat.service'
import { UsersService } from 'modules/users/users.service'
import type {
  Lobby,
  LobbyUser,
  T_UserId,
  T_SocketId,
  T_RoomId,
  LobbyChat,
  RoomTypeEnum,
  RoomChat,
} from 'models/app'

@Injectable()
export class LobbyService {
  constructor(
    private usersService: UsersService,
    private lobbyUsersService: LobbyUsersService,
    private lobbyRoomsService: LobbyRoomsService,
    private lobbyChatService: LobbyChatService,
  ) {}

  // Записываем пользователей из базы данных в лобби
  async init() {
    const usersDB = await this.usersService.getAll()
    this.lobbyUsersService.initUsers(usersDB)
  }

  getLobby(): Lobby {
    return {
      users: this.lobbyUsersService.getAll(),
      rooms: this.lobbyRoomsService.getAllPreview(),
      chat: this.lobbyChatService.getAll(),
    }
  }

  // Создаёт зарегистрированного пользователя в лобби
  createRegisteredUser(user: User): void {
    this.lobbyUsersService.create(user)
  }

  setUserOnline(userId: T_UserId, socketId: T_SocketId): LobbyUser {
    return this.lobbyUsersService.setOnlineByUserId(userId, socketId)
  }

  setUserOffline(socketId: string): LobbyUser {
    return this.lobbyUsersService.setOffline(socketId)
  }

  userLogout(
    roomId: T_RoomId,
    socketId: T_SocketId,
  ): { roomData: RoomResponse | false; userData: LobbyUser } {
    let roomData: RoomResponse | false = false
    const userData = this.lobbyUsersService.setOffline(socketId)

    // Исключаем пользователя из комнаты, если он в ней
    if (roomId) {
      roomData = this.lobbyRoomsService.removeUser(roomId, socketId)
    }

    return { roomData, userData }
  }

  // Создание сообщения в лобби
  createLobbyMessage(socketId: string, text: string): LobbyChat {
    const user = this.lobbyUsersService.findBySocketId(socketId)
    const message = this.lobbyChatService.create(user, text)

    return message
  }

  // Создание комнаты в лобби
  createRoom(
    socketId: T_SocketId,
    name: string,
    size: number,
    password: string,
    type: RoomTypeEnum,
  ): { roomData: RoomResponse; userData: LobbyUser } {
    const userData = this.lobbyUsersService.setInRoom(socketId)
    const roomData = this.lobbyRoomsService.create(
      userData,
      name,
      size,
      password,
      type,
    )

    return { roomData, userData }
  }

  // Вход в комнату
  joinRoom(
    socketId: T_SocketId,
    roomId: T_RoomId,
    roomPassword: string,
  ): { roomData: RoomResponse | false; userData: LobbyUser } {
    // TODO: Проверка на статус пользователя "в комнате"
    const userData = this.lobbyUsersService.setInRoom(socketId)
    const roomData = this.lobbyRoomsService.join(userData, roomId, roomPassword)

    return { userData, roomData }
  }

  rejoinRoom(
    socketId: string,
    roomId: string,
  ): { roomData: RoomResponse | false; userData: LobbyUser } {
    const userData = this.lobbyUsersService.setInRoom(socketId)
    const roomData = this.lobbyRoomsService.rejoin(userData, roomId)

    return { userData, roomData }
  }

  // Выход и комнаты
  leaveRoom(
    socketId: string,
    roomId: string,
  ): { roomData: RoomResponse | false; userData: LobbyUser } {
    const userData = this.lobbyUsersService.setOnlineBySocketId(socketId)
    const roomData = this.lobbyRoomsService.removeUser(roomId, socketId)

    return { userData, roomData }
  }

  // Создания сообщения в комнате
  createMessageInRoom(
    socketId: T_SocketId,
    roomId: T_RoomId,
    text: string,
  ): { message: RoomChat; roomId: T_RoomId } {
    const user = this.lobbyUsersService.findBySocketId(socketId)
    const message = this.lobbyRoomsService.createMessage(user, roomId, text)
    return { message, roomId: roomId }
  }
}
