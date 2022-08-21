import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'

import {
  E_AuthType,
  I_LobbyUser,
  T_SocketId,
  T_UserId,
  E_UserStatus,
} from 'models/app'

@Injectable()
export class LobbyUsersService {
  users: I_LobbyUser[] = []

  initUsers(usersDB: User[]) {
    this.users = usersDB.map(
      (user): I_LobbyUser => ({
        id: user.id,
        nickname: user.nickname,
        socketId: '',
        from: user.from as E_AuthType,
        status: E_UserStatus.offline,
      }),
    )

    console.log('user init', this.users)
  }

  getAll(): I_LobbyUser[] {
    return this.users
  }

  create(user: User) {
    const lobbyUser: I_LobbyUser = {
      id: user.id,
      nickname: user.nickname,
      socketId: '',
      status: E_UserStatus.offline,
      from: user.from as E_AuthType,
    }

    this.users.push(lobbyUser)
  }

  // Меняет статус пользователя на онлайн и устанавливает socketId
  setOnlineByUserId(userId: T_UserId, socketId: T_SocketId): I_LobbyUser {
    const userIndex = this.findIndexByUserId(userId)

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: E_UserStatus.online,
      socketId,
    }

    return this.users[userIndex]
  }

  setOfflineBySocketId(socketId: T_SocketId): I_LobbyUser | false {
    const userIndex = this.findIndexBySocketId(socketId)

    if (userIndex === -1) return false

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: E_UserStatus.offline,
      socketId: '',
    }

    return this.users[userIndex]
  }

  logout(socketId: T_SocketId): I_LobbyUser {
    const userIndex = this.findIndexBySocketId(socketId)
    const user = this.users[userIndex]

    user.socketId = ''
    user.status = E_UserStatus.offline

    // Если это гость
    if (user.from === E_AuthType.guest) {
      // Делаем пометку для фронта, чтобы он удалил его нахуй
      user.nickname = ''

      this.users.splice(userIndex, 1)
    }

    return user
  }

  findIndexByUserId(userId: T_UserId): number {
    return this.users.findIndex((user) => user.id === userId)
  }

  findIndexBySocketId(socketId: T_SocketId): number {
    return this.users.findIndex((user) => user.socketId === socketId)
  }

  findBySocketId(socketId: T_SocketId): I_LobbyUser {
    return this.users.find((user) => user.socketId === socketId)
  }
}
