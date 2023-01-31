import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'

import { TextEditorService } from './textEditor.service'

import {
  E_Emit,
  I_EmitPayload,
  E_Subscribe,
  I_SubscriptionData,
} from 'models/shared/socket/lobbyRooms'

@WebSocketGateway({ cors: true })
export class TextEditorGateway {
  @WebSocketServer()
  server: Server

  constructor(private textEditorService: TextEditorService) {}

  // Создание документа
  @SubscribeMessage(E_Emit.createDoc)
  createDoc(
    _: Socket,
    { roomId, description, title }: I_EmitPayload[E_Emit.createDoc],
  ) {
    const roomDoc = this.textEditorService.createDoc({
      roomId,
      description,
      title,
    })

    const response: I_SubscriptionData[E_Subscribe.getCreatedDoc] = {
      doc: roomDoc,
    }

    this.server.to(roomId).emit(E_Subscribe.getCreatedDoc, response)
  }

  // Обновление документа
  @SubscribeMessage(E_Emit.updateDoc)
  updateDoc(
    _: Socket,
    { roomId, docId, field, value }: I_EmitPayload[E_Emit.updateDoc],
  ) {
    const roomDoc = this.textEditorService.updateDoc({
      docId,
      field,
      roomId,
      value,
    })

    const response: I_SubscriptionData[E_Subscribe.getUpdatedDoc] = {
      doc: roomDoc,
    }

    this.server.to(roomId).emit(E_Subscribe.getUpdatedDoc, response)
  }

  // Удаление документа
  @SubscribeMessage(E_Emit.removeDoc)
  removeDoc(_: Socket, { docId, roomId }: I_EmitPayload[E_Emit.removeDoc]) {
    const roomDocId = this.textEditorService.removeDoc({ roomId, docId })

    const response: I_SubscriptionData[E_Subscribe.getRemovedDoc] = {
      docId: roomDocId,
    }

    this.server.to(roomId).emit(E_Subscribe.getRemovedDoc, response)
  }
}
