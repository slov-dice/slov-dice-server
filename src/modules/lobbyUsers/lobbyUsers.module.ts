import { Module, forwardRef } from '@nestjs/common'
import { LobbyRoomsModule } from 'modules/lobbyRooms/lobbyRooms.module'

import { UsersService } from 'modules/users/users.service'

import { LobbyUsersGateway } from './lobbyUsers.gateway'
import { LobbyUsersService } from './lobbyUsers.service'

@Module({
  imports: [forwardRef(() => LobbyRoomsModule)],
  providers: [LobbyUsersGateway, LobbyUsersService, UsersService],
  exports: [LobbyUsersService],
})
export class LobbyUsersModule {}
