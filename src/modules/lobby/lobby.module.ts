import { Module } from '@nestjs/common';

import { UsersService } from 'modules/users/users.service';
import { LobbyGateway } from './lobby.gateway';
import { LobbyService } from './lobby.service';
import { LobbyUsersService } from './lobbyUsers.service';
import { LobbyRoomsService } from './lobbyRooms.service';
import { LobbyChatService } from './lobbyChat.service';

@Module({
  providers: [
    LobbyGateway,
    LobbyService,
    UsersService,
    LobbyUsersService,
    LobbyRoomsService,
    LobbyChatService,
  ],
  exports: [LobbyService],
})
export class LobbyModule {}
