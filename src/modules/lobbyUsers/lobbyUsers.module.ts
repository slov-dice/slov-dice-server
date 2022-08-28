import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { UsersService } from 'modules/users/users.service'

import { LobbyUsersGateway } from './lobbyUsers.gateway'
import { LobbyUsersService } from './lobbyUsers.service'

@Module({
  providers: [LobbyUsersGateway, LobbyUsersService, UsersService],
  exports: [LobbyUsersService],
})
export class LobbyUsersModule {}
