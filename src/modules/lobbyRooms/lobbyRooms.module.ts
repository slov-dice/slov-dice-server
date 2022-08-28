import { Module } from '@nestjs/common'

import { LobbyRoomsService } from './lobbyRooms.service'
import { LobbyRoomsGateway } from './lobbyRooms.gateway'

import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'

@Module({
  imports: [LobbyUsersModule],
  providers: [LobbyRoomsGateway, LobbyRoomsService],
})
export class LobbyRoomsModule {}
