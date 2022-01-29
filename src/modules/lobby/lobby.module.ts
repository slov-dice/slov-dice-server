import { Module } from '@nestjs/common';

import { UsersService } from 'modules/users/users.service';
import { LobbyGateway } from './lobby.gateway';
import { LobbyService } from './lobby.service';

@Module({
  providers: [LobbyGateway, LobbyService, UsersService],
  exports: [LobbyService],
})
export class LobbyModule {}
