import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'

import { SettingsService } from './settings.service'

import { E_StatusServerMessage } from 'models/shared/app'
import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'
import { t } from 'languages'

@WebSocketGateway({ cors: true })
export class SettingsGateway {
  @WebSocketServer()
  server: Server

  constructor(private settingsService: SettingsService) {}

  // Изменение баров персонажей и болванок
  @SubscribeMessage(E_Emit.updateSettingsBars)
  updateCharactersWindowSettingsBars(
    _: Socket,
    { roomId, bars }: I_EmitPayload[E_Emit.updateSettingsBars],
  ): void {
    const { settingsBars, characters, masterDummies, playersDummies } =
      this.settingsService.updateCharactersWindowSettingsBars(roomId, bars)

    const response: I_SubscriptionData[E_Subscribe.getSettingsBars] = {
      bars: settingsBars,
      characters,
      masterDummies,
      playersDummies,
      message: t('room.success.characters.settings.bars'),
      status: E_StatusServerMessage.info,
    }

    this.server.to(roomId).emit(E_Subscribe.getSettingsBars, response)
  }
}
