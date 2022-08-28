import { Module } from '@nestjs/common'

import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'
import { UsersService } from 'modules/users/users.service'

import { LobbyChatGateway } from './lobbyChat.gateway'
import { LobbyChatService } from './lobbyChat.service'

@Module({
  imports: [LobbyUsersModule],
  providers: [LobbyChatGateway, LobbyChatService, UsersService],
})
export class LobbyChatModule {}
