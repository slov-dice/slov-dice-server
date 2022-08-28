import { E_RoomType, I_FullRoom, I_PreviewRoom } from 'models/app'

export enum E_Subscribe {
  getPreviewRooms = 'getPreviewRooms',
  roomCreated = 'roomCreated',
  getFullRoom = 'getFullRoom',
}

export interface I_SubscriptionData {
  [E_Subscribe.getPreviewRooms]: { previewRooms: I_PreviewRoom[] }
  [E_Subscribe.roomCreated]: { previewRoom: I_PreviewRoom }
  [E_Subscribe.getFullRoom]: { fullRoom: I_FullRoom }
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
