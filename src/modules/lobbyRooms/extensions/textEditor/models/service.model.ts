import { T_RoomId } from 'models/shared/app'
import { T_DocId } from 'models/shared/game/textEditor'

export interface I_CreateDoc {
  roomId: T_RoomId
  title: string
  description: string
}

export interface I_UpdateDoc {
  roomId: T_RoomId
  docId: T_DocId
  field: string
  value: string
}

export interface I_RemoveDoc {
  roomId: T_RoomId
  docId: T_DocId
}
