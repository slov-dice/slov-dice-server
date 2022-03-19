import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'

import { LobbyUser, SocketId, UserId, UserStatusEnum } from 'interfaces/app'

@Injectable()
export class LobbyUsersService {
  users: LobbyUser[] = []

  initUsers(users: User[] = []) {
    this.users = users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      socketId: '',
      status: UserStatusEnum.offline,
    }))
  }

  getAll(): LobbyUser[] {
    return this.users
  }

  create(user: User) {
    const lobbyUser: LobbyUser = {
      id: user.id,
      nickname: user.nickname,
      socketId: '',
      status: UserStatusEnum.offline,
    }

    this.users.push(lobbyUser)
  }

  // Меняет статус пользователя на онлайн и устанавливает socketId
  setOnlineByUserId(userId: UserId, socketId: SocketId): LobbyUser {
    const userIndex = this.findIndexByUserId(userId)

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: UserStatusEnum.online,
      socketId,
    }

    return this.users[userIndex]
  }

  setOnlineBySocketId(socketId: SocketId): LobbyUser {
    const userIndex = this.findIndexBySocketId(socketId)

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: UserStatusEnum.online,
    }

    return this.users[userIndex]
  }

  // Меняет статус пользователя на оффлайн и убирает socketId
  setOffline(socketId: SocketId): LobbyUser {
    const userIndex = this.findIndexBySocketId(socketId)

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: UserStatusEnum.offline,
      socketId: '',
    }

    return this.users[userIndex]
  }

  setInRoom(socketId: SocketId): LobbyUser {
    const userIndex = this.findIndexBySocketId(socketId)

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: UserStatusEnum.inRoom,
    }

    return this.users[userIndex]
  }

  findBySocketId(socketId: SocketId): LobbyUser {
    return this.users.find((user) => user.socketId === socketId)
  }

  findIndexByUserId(userId: UserId): number {
    return this.users.findIndex((user) => user.id === userId)
  }

  findIndexBySocketId(socketId: SocketId): number {
    return this.users.findIndex((user) => user.socketId === socketId)
  }
}
