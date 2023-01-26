import { Injectable } from '@nestjs/common'

import { I_CreateDoc, I_RemoveDoc, I_UpdateDoc } from './models/service.model'

import { LobbyRoomsService } from 'modules/lobbyRooms/lobbyRooms.service'
import { v4 } from 'uuid'
import { I_Doc, T_DocId } from 'models/shared/game/textEditor'

@Injectable()
export class TextEditorService {
  constructor(private lobbyRooms: LobbyRoomsService) {}

  createDoc({ roomId, title, description }: I_CreateDoc): I_Doc {
    const room = this.lobbyRooms.findRoomById(roomId)
    const doc: I_Doc = {
      title,
      description,
      content: '',
      id: v4(),
    }

    room.game.textEditor.window.docs.push(doc)

    return doc
  }

  updateDoc({ roomId, docId, field, value }: I_UpdateDoc): I_Doc {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.textEditor.window.docs = room.game.textEditor.window.docs.map(
      (doc) => (doc.id === docId ? { ...doc, [field]: value } : doc),
    )

    return room.game.textEditor.window.docs.find((doc) => doc.id === docId)
  }

  removeDoc({ docId, roomId }: I_RemoveDoc): T_DocId {
    const room = this.lobbyRooms.findRoomById(roomId)
    room.game.textEditor.window.docs = room.game.textEditor.window.docs.filter(
      (doc) => doc.id === docId,
    )

    return docId
  }
}
