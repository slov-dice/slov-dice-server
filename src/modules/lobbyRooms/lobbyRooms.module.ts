import { Module, forwardRef } from '@nestjs/common'

import { LobbyRoomsService } from './lobbyRooms.service'
import { LobbyRoomsGateway } from './lobbyRooms.gateway'
import { BattlefieldGateway } from './extensions/battlefield/battlefield.gateway'
import { BattlefieldService } from './extensions/battlefield/battlefield.service'
import { CharactersGateway } from './extensions/characters/characters.gateway'
import { CharactersService } from './extensions/characters/characters.service'
import { ChatGateway } from './extensions/chat/chat.gateway'
import { ChatService } from './extensions/chat/chat.service'
import { CommandsService } from './extensions/chat/commands.service'
import { SettingsGateway } from './extensions/settings/settings.gateway'
import { SettingsService } from './extensions/settings/settings.service'
import { TextEditorGateway } from './extensions/textEditor/textEditor.gateway'
import { TextEditorService } from './extensions/textEditor/textEditor.service'

import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'

@Module({
  imports: [forwardRef(() => LobbyUsersModule)],
  providers: [
    LobbyRoomsGateway,
    LobbyRoomsService,
    BattlefieldGateway,
    BattlefieldService,
    CharactersGateway,
    CharactersService,
    ChatGateway,
    ChatService,
    CommandsService,
    SettingsGateway,
    SettingsService,
    TextEditorGateway,
    TextEditorService,
  ],
  exports: [LobbyRoomsService],
})
export class LobbyRoomsModule {}
