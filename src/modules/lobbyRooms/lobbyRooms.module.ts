import { Module, forwardRef } from '@nestjs/common'

import { LobbyRoomsService } from './lobbyRooms.service'
import { LobbyRoomsGateway } from './lobbyRooms.gateway'
import { BattlefieldGateway } from './extensions/battlefield/battlefield.gateway'
import { BattlefieldService } from './extensions/battlefield/battlefield.service'

import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'

@Module({
  imports: [forwardRef(() => LobbyUsersModule)],
  providers: [
    LobbyRoomsGateway,
    LobbyRoomsService,
    BattlefieldGateway,
    BattlefieldService,
  ],
  exports: [LobbyRoomsService],
})
export class LobbyRoomsModule {}
