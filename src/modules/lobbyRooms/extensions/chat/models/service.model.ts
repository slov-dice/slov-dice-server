import { T_RoomId, T_SocketId } from 'models/shared/app'

export interface I_GetRoomMessages {
  roomId: T_RoomId
}

export interface I_CreateMessage {
  socketId: T_SocketId
  roomId: T_RoomId
  text: string
}
