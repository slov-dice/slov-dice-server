import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'

import { BattlefieldService } from './battlefield.service'

import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'

@WebSocketGateway({ cors: true })
export class BattlefieldGateway {
  @WebSocketServer()
  server: Server

  constructor(private battlefieldService: BattlefieldService) {}

  // Создание экземпляра болванки
  @SubscribeMessage(E_Emit.createDummy)
  createDummy(
    _: Socket,
    { roomId, battlefield, dummy }: I_EmitPayload[E_Emit.createDummy],
  ) {
    const roomDummy = this.battlefieldService.createDummy({
      roomId,
      battlefield,
      dummy,
    })

    const response: I_SubscriptionData[E_Subscribe.getCreatedDummy] = {
      battlefield,
      dummy: roomDummy,
    }

    this.server.to(roomId).emit(E_Subscribe.getCreatedDummy, response)
  }

  // Добавление болванки на поле боя
  @SubscribeMessage(E_Emit.addDummyToBattlefield)
  addDummyToBattlefield(
    _: Socket,
    { battlefield, dummy, roomId }: I_EmitPayload[E_Emit.addDummyToBattlefield],
  ) {
    const fieldDummies = this.battlefieldService.addDummyToBattlefield({
      roomId,
      battlefield,
      dummy,
    })

    const response: I_SubscriptionData[E_Subscribe.getDummiesOnBattlefield] = {
      dummies: fieldDummies,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getDummiesOnBattlefield, response)
  }

  // Выполнение действия между карточками болванок или игроков
  @SubscribeMessage(E_Emit.makeActionInBattlefield)
  makeActionInBattlefield(
    _: Socket,
    {
      action,
      actionInitiator,
      actionTarget,
      roomId,
      userId,
    }: I_EmitPayload[E_Emit.makeActionInBattlefield],
  ) {
    const { characters, masterField, playersField } =
      this.battlefieldService.makeAction({
        action,
        actionTarget,
        actionInitiator,
        roomId,
        userId,
      })

    const response: I_SubscriptionData[E_Subscribe.getInitiationActionOnBattlefield] =
      {
        characters,
        masterField,
        playersField,
        to: { id: actionTarget },
        from: { id: actionInitiator },
      }

    this.server
      .to(roomId)
      .emit(E_Subscribe.getInitiationActionOnBattlefield, response)
  }

  // Быстрое изменение поля конкретного экземпляра болванки
  @SubscribeMessage(E_Emit.updateDummyField)
  updateDummyField(
    _: Socket,
    {
      roomId,
      dummyId,
      field,
      value,
      battlefield,
      subFieldId,
    }: I_EmitPayload[E_Emit.updateDummyField],
  ) {
    const roomDummy = this.battlefieldService.updateDummyField({
      roomId,
      dummyId,
      field,
      value,
      battlefield,
      subFieldId,
    })

    const response: I_SubscriptionData[E_Subscribe.getUpdatedDummy] = {
      dummy: roomDummy,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getUpdatedDummy, response)
  }

  // Обновление экземпляра болванки
  @SubscribeMessage(E_Emit.updateDummy)
  updateDummy(
    client: Socket,
    { battlefield, dummy, roomId }: I_EmitPayload[E_Emit.updateDummy],
  ) {
    const roomDummy = this.battlefieldService.updateDummy({
      roomId,
      dummy,
      battlefield,
    })

    const response: I_SubscriptionData[E_Subscribe.getUpdatedDummy] = {
      dummy: roomDummy,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getUpdatedDummy, response)
  }

  // Быстрое изменение поля конкретной болванки
  @SubscribeMessage(E_Emit.updateDummyFieldOnBattlefield)
  updateDummyFieldOnBattlefield(
    _: Socket,
    {
      battlefield,
      dummySubId,
      field,
      roomId,
      value,
      subFieldId,
    }: I_EmitPayload[E_Emit.updateDummyFieldOnBattlefield],
  ) {
    const fieldDummies = this.battlefieldService.updateDummyFieldOnBattlefield({
      roomId,
      battlefield,
      field,
      dummySubId,
      value,
      subFieldId,
    })
    const response: I_SubscriptionData[E_Subscribe.getDummiesOnBattlefield] = {
      dummies: fieldDummies,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getDummiesOnBattlefield, response)
  }

  // Удаление болванки с поля боя
  @SubscribeMessage(E_Emit.removeDummy)
  removeDummy(
    _: Socket,
    { battlefield, dummyId, roomId }: I_EmitPayload[E_Emit.removeDummy],
  ) {
    const roomDummyId = this.battlefieldService.removeDummy({
      roomId,
      dummyId,
      battlefield,
    })

    const response: I_SubscriptionData[E_Subscribe.getRemovedDummy] = {
      dummyId: roomDummyId,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getRemovedDummy, response)
  }

  // Удаление экземпляра болванки и болванок с поля боя
  @SubscribeMessage(E_Emit.removeDummyOnBattlefield)
  removeDummyOnBattlefield(
    _: Socket,
    {
      battlefield,
      dummySubId,
      roomId,
    }: I_EmitPayload[E_Emit.removeDummyOnBattlefield],
  ) {
    const fieldDummies = this.battlefieldService.removeDummyOnBattlefield({
      battlefield,
      dummySubId,
      roomId,
    })

    const response: I_SubscriptionData[E_Subscribe.getDummiesOnBattlefield] = {
      dummies: fieldDummies,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getDummiesOnBattlefield, response)
  }

  // Удаление всех болванок по экземпляру с поля боя
  @SubscribeMessage(E_Emit.removeDummiesOnBattlefield)
  removeDummiesOnBattlefield(
    _: Socket,
    {
      battlefield,
      dummyId,
      roomId,
    }: I_EmitPayload[E_Emit.removeDummiesOnBattlefield],
  ) {
    const fieldDummies = this.battlefieldService.removeDummiesOnBattlefield({
      battlefield,
      dummyId,
      roomId,
    })

    const response: I_SubscriptionData[E_Subscribe.getDummiesOnBattlefield] = {
      dummies: fieldDummies,
      battlefield,
    }

    this.server.to(roomId).emit(E_Subscribe.getDummiesOnBattlefield, response)
  }
}
