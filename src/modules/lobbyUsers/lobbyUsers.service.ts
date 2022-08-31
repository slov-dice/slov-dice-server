import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'

import {
  E_AuthType,
  I_LobbyUser,
  T_SocketId,
  T_UserId,
  E_UserStatus,
} from 'models/app'
import { UsersService } from 'modules/users/users.service'

@Injectable()
export class LobbyUsersService {
  constructor(private usersService: UsersService) {}

  users: I_LobbyUser[] = []

  async initUsers() {
    const usersDB = await this.usersService.getAll()
    this.users = usersDB.map(
      (user): I_LobbyUser => ({
        id: user.id,
        nickname: user.nickname,
        socketId: '',
        from: user.from as E_AuthType,
        status: E_UserStatus.offline,
      }),
    )

    console.log('users init', this.users)
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
    const user = this.findByUserId(userId)
    user.status = E_UserStatus.online
    user.socketId = socketId
    return user
  }

  setOnlineBySocketId(socketId: T_SocketId): I_LobbyUser {
    const user = this.findBySocketId(socketId)
    user.status = E_UserStatus.online
    return user
  }

  setOfflineBySocketId(socketId: T_SocketId): I_LobbyUser | false {
    const user = this.findBySocketId(socketId)

    if (!user) return false

    user.status = E_UserStatus.offline
    user.socketId = ''

    return user
  }

  setInRoomByUserId(userId: T_UserId, socketId: T_SocketId): I_LobbyUser {
    const user = this.findByUserId(userId)
    user.status = E_UserStatus.inRoom
    user.socketId = socketId
    return user
  }

  setInRoomBySocketId(socketId: T_SocketId): I_LobbyUser {
    const user = this.findBySocketId(socketId)
    user.status = E_UserStatus.inRoom
    return user
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

    console.log('user logout', user)

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

  findByUserId(userId: T_UserId): I_LobbyUser {
    return this.users.find((user) => user.id === userId)
  }
}
