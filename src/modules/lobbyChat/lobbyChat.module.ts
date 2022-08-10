import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import { UsersService } from 'modules/users/users.service'

import { LobbyChatGateway } from './lobbyChat.gateway'
import { LobbyChatService } from './lobbyChat.service'

@Module({
  imports: [JwtModule.register({})],
  providers: [
    LobbyChatGateway,
    LobbyChatService,
    LobbyUsersService,
    UsersService
  ],
})
export class LobbyChatModule {}
