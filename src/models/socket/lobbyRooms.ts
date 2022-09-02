import {
  E_RoomType,
  E_StatusServerMessage,
  I_FullRoom,
  I_RoomMessage,
  I_PreviewRoom,
  T_LocaleServerMessage,
  T_RoomId,
  T_UserId,
} from 'models/app'

export enum E_Subscribe {
  getPreviewRooms = 'getPreviewRooms',
  getPreviewRoom = 'getPreviewRoom',
  getFullRoom = 'getFullRoom',
  getRoomMessage = 'getRoomMessage',
}

export interface I_SubscriptionData {
  [E_Subscribe.getPreviewRooms]: { previewRooms: I_PreviewRoom[] }
  [E_Subscribe.getPreviewRoom]: { previewRoom: I_PreviewRoom }
  [E_Subscribe.getFullRoom]: {
    fullRoom?: I_FullRoom
    status?: E_StatusServerMessage
    message?: T_LocaleServerMessage
  }
  [E_Subscribe.getRoomMessage]: { message: I_RoomMessage }
}

export enum E_Emit {
  requestPreviewRooms = 'requestPreviewRooms',
  createRoom = 'createRoom',
  joinRoom = 'joinRoom',
  rejoinRoom = 'rejoinRoom',
  leaveRoom = 'leaveRoom',
  sendMessageRoom = 'sendMessageRoom',
}

export interface I_EmitPayload {
  [E_Emit.requestPreviewRooms]: null
  [E_Emit.createRoom]: {
    roomName: string
    roomSize: number
    roomPassword: string
    roomType: E_RoomType
  }
  [E_Emit.joinRoom]: {
    roomId: T_RoomId
    password?: string
  }
  [E_Emit.rejoinRoom]: {
    userId: T_UserId
  }
  [E_Emit.leaveRoom]: {
    roomId: T_RoomId
  }
  [E_Emit.sendMessageRoom]: {
    roomId: T_RoomId
    text: string
  }
}
