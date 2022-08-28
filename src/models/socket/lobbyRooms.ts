import {
  E_RoomType,
  I_FullRoom,
  I_PreviewRoom,
  T_LocaleServerMessage,
} from 'models/app'

export enum E_Subscribe {
  getPreviewRooms = 'getPreviewRooms',
  getPreviewRoom = 'getPreviewRoom',
  getFullRoom = 'getFullRoom',
}

export interface I_SubscriptionData {
  [E_Subscribe.getPreviewRooms]: { previewRooms: I_PreviewRoom[] }
  [E_Subscribe.getPreviewRoom]: { previewRoom: I_PreviewRoom }
  [E_Subscribe.getFullRoom]: {
    fullRoom: I_FullRoom
    message: T_LocaleServerMessage
  }
}

export enum E_Emit {
  requestPreviewRooms = 'requestPreviewRooms',
  createRoom = 'createRoom',
}

export interface I_EmitPayload {
  [E_Emit.requestPreviewRooms]: null
  [E_Emit.createRoom]: {
    roomName: string
    roomSize: number
    roomPassword: string
    roomType: E_RoomType
  }
}
