import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'

import { LobbyUser, T_SocketId, T_UserId, UserStatusEnum } from 'models/app'

@Injectable()
export class LobbyUsersService {
  users: LobbyUser[] = []

  initUsers(usersDB: User[]) {
    this.users = usersDB.map(
      (user): LobbyUser => ({
        id: user.id,
        nickname: user.nickname,
        socketId: '',
        status: UserStatusEnum.offline,
      }),
    )

    console.log('user init', this.users)
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
  setOnlineByUserId(userId: T_UserId, socketId: T_SocketId): LobbyUser {
    const userIndex = this.findIndexByUserId(userId)

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: UserStatusEnum.online,
      socketId,
    }

    return this.users[userIndex]
  }

  setOfflineBySocketId(socketId: T_SocketId): LobbyUser | false {
    const userIndex = this.findIndexBySocketId(socketId)

    if (userIndex === -1) return false

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: UserStatusEnum.offline,
      socketId: '',
    }

    return this.users[userIndex]
  }

  findIndexByUserId(userId: T_UserId): number {
    return this.users.findIndex((user) => user.id === userId)
  }

  findIndexBySocketId(socketId: T_SocketId): number {
    return this.users.findIndex((user) => user.socketId === socketId)
  }

  findBySocketId(socketId: T_SocketId): LobbyUser {
    return this.users.find((user) => user.socketId === socketId)
  }
}
