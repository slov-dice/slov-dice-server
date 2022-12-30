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

import { LobbyRoomsService } from './lobbyRooms.service'

import { E_StatusServerMessage } from 'models/shared/app'
import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'
import { E_Subscribe as E_LUSubscribe } from 'models/shared/socket/lobbyUsers'
import { t } from 'languages'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'

@WebSocketGateway({ cors: true })
export class LobbyRoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('LobbyRoomsGateway')

  constructor(
    private lobbyRooms: LobbyRoomsService,
    private lobbyUsers: LobbyUsersService,
  ) {}

  // Инициализация приложения
  async afterInit() {
    this.logger.log('Init LobbyRoomsGateway')
  }

  // Подключение сокета
  handleConnection(client: Socket) {
    this.logger.log(`Client connected LobbyRoomsGateway: ${client.id}`)
  }

  // Отключение сокета
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  // Получение всех комнат
  @SubscribeMessage(E_Emit.requestPreviewRooms)
  requestRooms(client: Socket) {
    const rooms = this.lobbyRooms.getAllPreviewRooms()
    const payload: I_SubscriptionData[E_Subscribe.getPreviewRooms] = {
      previewRooms: rooms,
    }

    // Отправляем список превью комнат в лобби ОТПРАВИТЕЛЮ
    client.emit(E_Subscribe.getPreviewRooms, payload)
  }

  // Создание комнаты
  @SubscribeMessage(E_Emit.createRoom)
  createRoom(client: Socket, data: I_EmitPayload[E_Emit.createRoom]) {
    const { roomName, roomSize, roomPassword, roomType } = data

    // Создаём комнату, добавляем туда создателя
    const { fullRoom, previewRoom, user } = this.lobbyRooms.create(
      client.id,
      roomName,
      roomSize,
      roomPassword,
      roomType,
    )

    // Подключаем ОТПРАВИТЕЛЯ к комнате
    client.join(fullRoom.id)

    // Отправляем превью комнату всем, кроме отправителя
    client.broadcast.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всю комнату отправителю
    client.emit(E_Subscribe.getFullRoom, {
      fullRoom,
      message: t('room.success.created'),
      status: E_StatusServerMessage.success,
    })

    // Отправляем всем обновлённого пользователя
    this.server.emit(E_LUSubscribe.getLobbyUser, { user })
  }

  // Вход пользователя в комнату
  @SubscribeMessage(E_Emit.joinRoom)
  joinRoom(client: Socket, data: I_EmitPayload[E_Emit.joinRoom]) {
    const { roomId, password } = data
    const clientPayload = this.lobbyRooms.join(client.id, roomId, password)

    if (!clientPayload.fullRoom) {
      client.emit(E_Subscribe.getFullRoom, clientPayload)
      return
    }

    // Подключаем пользователя к сокет комнате
    client.join(clientPayload.fullRoom.id)
    client.emit(E_Subscribe.getFullRoom, clientPayload)

    // Отправляем обновлённую полную комнату ВСЕМ в комнате
    const response: I_SubscriptionData[E_Subscribe.getFullRoom] = {
      fullRoom: clientPayload.fullRoom,
      message: t('room.info.userJoin'),
      status: E_StatusServerMessage.info,
    }
    client.to(clientPayload.fullRoom.id).emit(E_Subscribe.getFullRoom, response)

    // Отправляем всем обновлённое превью комнаты
    const previewRoom = this.lobbyRooms.fullToPreviewRoom(
      clientPayload.fullRoom,
    )
    this.server.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всем обновлённого пользователя
    const user = this.lobbyUsers.findBySocketId(client.id)
    this.server.emit(E_LUSubscribe.getLobbyUser, { user })
  }

  // Ручной выход из комнаты
  @SubscribeMessage(E_Emit.leaveRoom)
  leaveRoom(client: Socket, data: I_EmitPayload[E_Emit.leaveRoom]) {
    const { fullRoom, previewRoom } = this.lobbyRooms.leave(
      client.id,
      data.roomId,
    )

    const user = this.lobbyUsers.setOnlineBySocketId(client.id)

    // Отключаем пользователя от сокет комнаты
    client.leave(fullRoom.id)

    // Отправляем обновлённую полную комнату ВСЕМ в комнате
    const toRoomPayload: I_SubscriptionData[E_Subscribe.getFullRoom] = {
      fullRoom: fullRoom,
      message: t('room.info.userLeft'),
      status: E_StatusServerMessage.info,
    }
    client.to(fullRoom.id).emit(E_Subscribe.getFullRoom, toRoomPayload)

    // Отправляем всем обновлённое превью комнаты
    this.server.emit(E_Subscribe.getPreviewRoom, { previewRoom })

    // Отправляем всем обновлённого пользователя
    this.server.emit(E_LUSubscribe.getLobbyUser, { user })
  }

  @SubscribeMessage(E_Emit.sendMessageRoom)
  sendMessageToRoom(
    client: Socket,
    { roomId, text }: I_EmitPayload[E_Emit.sendMessageRoom],
  ): void {
    const message = this.lobbyRooms.createMessage(client.id, roomId, text)

    this.server.to(roomId).emit(E_Subscribe.getRoomMessage, { message })
  }

  @SubscribeMessage(E_Emit.requestRoomMessages)
  requestRoomMessages(
    client: Socket,
    { roomId }: I_EmitPayload[E_Emit.requestRoomMessages],
  ): void {
    const response: I_SubscriptionData[E_Subscribe.getRoomChat] = {
      messages: this.lobbyRooms.getRoomMessages(roomId),
    }

    this.server.to(roomId).emit(E_Subscribe.getRoomChat, response)
  }

  @SubscribeMessage(E_Emit.updateCharactersWindowSettingsBars)
  updateCharactersWindowSettingsBars(
    client: Socket,
    { roomId, bars }: I_EmitPayload[E_Emit.updateCharactersWindowSettingsBars],
  ): void {
    const { settingsBars, characters, masterDummies, playersDummies } =
      this.lobbyRooms.updateCharactersWindowSettingsBars(roomId, bars)

    const response: I_SubscriptionData[E_Subscribe.getCharactersWindowSettingsBars] =
      {
        bars: settingsBars,
        characters,
        masterDummies,
        playersDummies,
        message: t('room.success.characters.settings.bars'),
        status: E_StatusServerMessage.info,
      }

    this.server
      .to(roomId)
      .emit(E_Subscribe.getCharactersWindowSettingsBars, response)
  }

  @SubscribeMessage(E_Emit.updateCharactersWindowSettingsSpecials)
  updateCharactersWindowSettingsSpecials(
    client: Socket,
    {
      roomId,
      specials,
    }: I_EmitPayload[E_Emit.updateCharactersWindowSettingsSpecials],
  ): void {
    const { settingsSpecials, characters } =
      this.lobbyRooms.updateCharactersWindowSettingsSpecials(roomId, specials)

    const response: I_SubscriptionData[E_Subscribe.getCharactersWindowSettingsSpecials] =
      {
        specials: settingsSpecials,
        characters,
        message: t('room.success.characters.settings.specials'),
        status: E_StatusServerMessage.info,
      }

    this.server
      .to(roomId)
      .emit(E_Subscribe.getCharactersWindowSettingsSpecials, response)
  }

  @SubscribeMessage(E_Emit.updateCharactersWindowSettingsEffects)
  updateCharactersWindowSettingsEffects(
    client: Socket,
    {
      roomId,
      effects,
    }: I_EmitPayload[E_Emit.updateCharactersWindowSettingsEffects],
  ): void {
    const { characters, settingsEffects } =
      this.lobbyRooms.updateCharactersWindowSettingsEffects(roomId, effects)

    const response: I_SubscriptionData[E_Subscribe.getCharactersWindowSettingsEffects] =
      {
        effects: settingsEffects,
        characters,
        message: t('room.success.characters.settings.effects'),
        status: E_StatusServerMessage.info,
      }

    client
      .to(roomId)
      .emit(E_Subscribe.getCharactersWindowSettingsEffects, response)
  }

  @SubscribeMessage(E_Emit.createCharacterInCharactersWindow)
  createCharacterInCharactersWindow(
    client: Socket,
    {
      roomId,
      character,
    }: I_EmitPayload[E_Emit.createCharacterInCharactersWindow],
  ): void {
    const roomCharacter = this.lobbyRooms.createCharacterInCharactersWindow(
      roomId,
      character,
    )

    const response: I_SubscriptionData[E_Subscribe.getCreatedCharacterInCharactersWindow] =
      {
        character: roomCharacter,
        message: t('room.success.characters.character.created'),
        status: E_StatusServerMessage.info,
      }

    this.server
      .to(roomId)
      .emit(E_Subscribe.getCreatedCharacterInCharactersWindow, response)
  }

  @SubscribeMessage(E_Emit.updateCharacterInCharactersWindow)
  updateCharacterInCharactersWindow(
    client: Socket,
    {
      roomId,
      character,
    }: I_EmitPayload[E_Emit.updateCharacterInCharactersWindow],
  ): void {
    const roomCharacter = this.lobbyRooms.updateCharacterInCharactersWindow(
      roomId,
      character,
    )

    const response: I_SubscriptionData[E_Subscribe.getUpdatedCharacterInCharactersWindow] =
      {
        character: roomCharacter,
      }

    this.server
      .to(roomId)
      .emit(E_Subscribe.getUpdatedCharacterInCharactersWindow, response)
  }

  @SubscribeMessage(E_Emit.updateCharacterFieldInCharactersWindow)
  updateCharacterFieldInCharactersWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.updateCharacterFieldInCharactersWindow],
  ): void {
    const roomCharacter =
      this.lobbyRooms.updateCharacterFieldInCharactersWindow(
        data.roomId,
        data.characterId,
        data.field,
        data.value,
        data.subFieldId,
      )

    const response: I_SubscriptionData[E_Subscribe.getUpdatedCharacterInCharactersWindow] =
      {
        character: roomCharacter,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getUpdatedCharacterInCharactersWindow, response)
  }

  @SubscribeMessage(E_Emit.removeCharacterInCharactersWindow)
  removeCharacterInCharactersWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.removeCharacterInCharactersWindow],
  ) {
    const roomCharacterId = this.lobbyRooms.removeCharacterInCharactersWindow(
      data.roomId,
      data.characterId,
    )

    const response: I_SubscriptionData[E_Subscribe.getRemovedCharacterInCharactersWindow] =
      {
        characterId: roomCharacterId,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getRemovedCharacterInCharactersWindow, response)
  }

  @SubscribeMessage(E_Emit.createDummyInBattlefieldWindow)
  createDummyInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.createDummyInBattlefieldWindow],
  ) {
    const roomDummy = this.lobbyRooms.createDummyInBattlefieldWindow(
      data.roomId,
      data.dummy,
      data.field,
    )

    const response: I_SubscriptionData[E_Subscribe.getCreatedDummyInBattlefieldWindow] =
      {
        field: data.field,
        dummy: roomDummy,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getCreatedDummyInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.addDummyToFieldInBattlefieldWindow)
  addDummyToFieldInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.addDummyToFieldInBattlefieldWindow],
  ) {
    const fieldDummies = this.lobbyRooms.addDummyToFieldInBattlefieldWindow(
      data.roomId,
      data.dummy,
      data.field,
    )

    const response: I_SubscriptionData[E_Subscribe.getDummiesOnFieldInBattlefieldWindow] =
      {
        dummies: fieldDummies,
        field: data.field,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getDummiesOnFieldInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.removeDummiesOnFieldInBattlefieldWindow)
  removeDummiesOnFieldInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.removeDummiesOnFieldInBattlefieldWindow],
  ) {
    const fieldDummies =
      this.lobbyRooms.removeDummiesOnFieldInBattlefieldWindow(
        data.roomId,
        data.dummyId,
        data.field,
      )

    const response: I_SubscriptionData[E_Subscribe.getDummiesOnFieldInBattlefieldWindow] =
      {
        dummies: fieldDummies,
        field: data.field,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getDummiesOnFieldInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.updateDummyFieldOnFieldInBattlefieldWindow)
  updateDummyFieldOnFieldInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.updateDummyFieldOnFieldInBattlefieldWindow],
  ) {
    const fieldDummies =
      this.lobbyRooms.updateDummyFieldOnFieldInBattlefieldWindow(
        data.roomId,
        data.battlefield,
        data.field,
        data.dummySubId,
        data.value,
        data.subFieldId,
      )
    const response: I_SubscriptionData[E_Subscribe.getDummiesOnFieldInBattlefieldWindow] =
      {
        dummies: fieldDummies,
        field: data.battlefield,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getDummiesOnFieldInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.makeActionInBattlefieldWindow)
  makeActionInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.makeActionInBattlefieldWindow],
  ) {
    const { characters, masterField, playersField } =
      this.lobbyRooms.makeActionInBattlefieldWindow(
        data.roomId,
        data.action,
        data.actionTarget,
      )

    const response: I_SubscriptionData[E_Subscribe.getInitiationActionInBattlefieldWindow] =
      {
        characters,
        masterField,
        playersField,
        to: { id: data.actionTarget },
        from: { id: data.actionInitiator },
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getInitiationActionInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.updateDummyFieldInBattlefieldWindow)
  updateDummyFieldInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.updateDummyFieldInBattlefieldWindow],
  ) {
    const roomDummy = this.lobbyRooms.updateDummyFieldInBattlefieldWindow(
      data.roomId,
      data.dummyId,
      data.field,
      data.value,
      data.battlefield,
      data.subFieldId,
    )

    const response: I_SubscriptionData[E_Subscribe.getUpdatedDummyInBattlefieldWindow] =
      {
        dummy: roomDummy,
        field: data.battlefield,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getUpdatedDummyInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.updateDummyInBattlefieldWindow)
  updateDummyInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.updateDummyInBattlefieldWindow],
  ) {
    const roomDummy = this.lobbyRooms.updateDummyInBattlefieldWindow(
      data.roomId,
      data.dummy,
      data.field,
    )

    const response: I_SubscriptionData[E_Subscribe.getUpdatedDummyInBattlefieldWindow] =
      {
        dummy: roomDummy,
        field: data.field,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getUpdatedDummyInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.removeDummyInBattlefieldWindow)
  removeDummyInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.removeDummyInBattlefieldWindow],
  ) {
    const roomDummyId = this.lobbyRooms.removeDummyInBattlefieldWindow(
      data.roomId,
      data.dummyId,
      data.field,
    )

    const response: I_SubscriptionData[E_Subscribe.getRemovedDummyInBattlefieldWindow] =
      {
        dummyId: roomDummyId,
        field: data.field,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getRemovedDummyInBattlefieldWindow, response)
  }

  @SubscribeMessage(E_Emit.removeDummyOnFieldInBattlefieldWindow)
  removeDummyOnFieldInBattlefieldWindow(
    client: Socket,
    data: I_EmitPayload[E_Emit.removeDummyOnFieldInBattlefieldWindow],
  ) {
    const fieldDummies = this.lobbyRooms.removeDummyOnFieldInBattlefieldWindow(
      data.roomId,
      data.dummySubId,
      data.field,
    )

    const response: I_SubscriptionData[E_Subscribe.getDummiesOnFieldInBattlefieldWindow] =
      {
        dummies: fieldDummies,
        field: data.field,
      }

    this.server
      .to(data.roomId)
      .emit(E_Subscribe.getDummiesOnFieldInBattlefieldWindow, response)
  }
}
