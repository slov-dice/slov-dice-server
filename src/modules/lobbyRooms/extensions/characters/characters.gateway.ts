import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Socket, Server } from 'socket.io'

import { CharactersService } from './characters.service'

import { E_StatusServerMessage } from 'models/shared/app'
import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'
import { t } from 'languages'

@WebSocketGateway({ cors: true })
export class CharactersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('CharactersGateway')

  constructor(private charactersService: CharactersService) {}

  // Инициализация приложения
  async afterInit() {
    this.logger.log('Init CharactersGateway')
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected CharactersGateway: ${client.id}`)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  // Изменение базовых характеристик у персонажей
  @SubscribeMessage(E_Emit.updateCharactersSettingsSpecials)
  updateCharactersSettingsSpecials(
    _: Socket,
    {
      roomId,
      specials,
    }: I_EmitPayload[E_Emit.updateCharactersSettingsSpecials],
  ) {
    const { settingsSpecials, characters } =
      this.charactersService.updateCharactersSettingsSpecials({
        roomId,
        specials,
      })

    const response: I_SubscriptionData[E_Subscribe.getCharactersSettingsSpecials] =
      {
        specials: settingsSpecials,
        characters,
        message: t('room.success.characters.settings.specials'),
        status: E_StatusServerMessage.info,
      }

    this.server
      .to(roomId)
      .emit(E_Subscribe.getCharactersSettingsSpecials, response)
  }

  // Изменение базовых эффектов у персонажей
  @SubscribeMessage(E_Emit.updateCharactersSettingsEffects)
  updateCharactersSettingsEffects(
    client: Socket,
    { roomId, effects }: I_EmitPayload[E_Emit.updateCharactersSettingsEffects],
  ) {
    const { characters, settingsEffects } =
      this.charactersService.updateCharactersSettingsEffects({
        roomId,
        effects,
      })

    const response: I_SubscriptionData[E_Subscribe.getCharactersSettingsEffects] =
      {
        effects: settingsEffects,
        characters,
        message: t('room.success.characters.settings.effects'),
        status: E_StatusServerMessage.info,
      }

    client.to(roomId).emit(E_Subscribe.getCharactersSettingsEffects, response)
  }

  // Создание персонажа
  @SubscribeMessage(E_Emit.createCharacter)
  createCharacter(
    _: Socket,
    { roomId, character }: I_EmitPayload[E_Emit.createCharacter],
  ) {
    const roomCharacter = this.charactersService.createCharacter({
      roomId,
      character,
    })

    const response: I_SubscriptionData[E_Subscribe.getCreatedCharacter] = {
      character: roomCharacter,
      message: t('room.success.characters.character.created'),
      status: E_StatusServerMessage.info,
    }

    this.server.to(roomId).emit(E_Subscribe.getCreatedCharacter, response)
  }

  // Обновление персонажа
  @SubscribeMessage(E_Emit.updateCharacter)
  updateCharacter(
    _: Socket,
    { roomId, character }: I_EmitPayload[E_Emit.updateCharacter],
  ) {
    const roomCharacter = this.charactersService.updateCharacter({
      roomId,
      character,
    })

    const response: I_SubscriptionData[E_Subscribe.getUpdatedCharacter] = {
      character: roomCharacter,
    }

    this.server.to(roomId).emit(E_Subscribe.getUpdatedCharacter, response)
  }

  // Обновление конкретного поля у персонажа
  @SubscribeMessage(E_Emit.updateCharacterField)
  updateCharacterField(
    _: Socket,
    {
      characterId,
      field,
      roomId,
      value,
      subFieldId,
    }: I_EmitPayload[E_Emit.updateCharacterField],
  ) {
    const roomCharacter = this.charactersService.updateCharacterField({
      roomId,
      characterId,
      field,
      value,
      subFieldId,
    })

    const response: I_SubscriptionData[E_Subscribe.getUpdatedCharacter] = {
      character: roomCharacter,
    }

    this.server.to(roomId).emit(E_Subscribe.getUpdatedCharacter, response)
  }

  // Удаление персонажа
  @SubscribeMessage(E_Emit.removeCharacter)
  removeCharacterInCharactersWindow(
    _: Socket,
    { characterId, roomId }: I_EmitPayload[E_Emit.removeCharacter],
  ) {
    const roomCharacterId = this.charactersService.removeCharacter({
      roomId,
      characterId,
    })

    const response: I_SubscriptionData[E_Subscribe.getRemovedCharacter] = {
      characterId: roomCharacterId,
    }

    this.server.to(roomId).emit(E_Subscribe.getRemovedCharacter, response)
  }
}
