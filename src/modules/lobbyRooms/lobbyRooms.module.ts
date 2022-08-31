import { Module, forwardRef } from '@nestjs/common'

import { LobbyRoomsService } from './lobbyRooms.service'
import { LobbyRoomsGateway } from './lobbyRooms.gateway'

import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'

@Module({
  imports: [forwardRef(() => LobbyUsersModule)],
  providers: [LobbyRoomsGateway, LobbyRoomsService],
  exports: [LobbyRoomsService],
})
export class LobbyRoomsModule {}
