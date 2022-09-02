export type T_SocketId = string
export type T_UserId = number
export type T_RoomId = string
export type T_AccessToken = string
export type T_RefreshToken = string

export type T_Tokens = {
  access_token: string
  refresh_token: string
}

export enum E_UserStatus {
  offline = 'offline',
  online = 'online',
  inRoom = 'inRoom',
}

export enum E_RoomType {
  public = 'PUBLIC',
  private = 'PRIVATE',
}

export enum E_RoomMessageType {
  custom = 'custom',
  command = 'command',
}

export enum E_AuthType {
  email = 'EMAIL',
  google = 'GOOGLE',
  discord = 'DISCORD',
  guest = 'GUEST',
}

export enum E_Locale {
  ru = 'RU',
  en = 'EN',
}

export type T_SocketDataStatus = {
  message: T_LocaleServerMessage
  status: E_StatusServerMessage
}

export type T_LocaleServerMessage = Record<E_Locale, string>

export enum E_StatusServerMessage {
  success = 'success',
  error = 'error',
  info = 'info',
}

export interface I_Profile {
  id: T_UserId
  email: string
  nickname: string
  statuses: {
    isAuth: boolean
    inRoom: boolean
  }
}

export interface I_LobbyUser {
  socketId: T_SocketId
  id: T_UserId
  nickname: string
  from: E_AuthType
  status: E_UserStatus
}

export interface I_LobbyMessage {
  id: string
  authorId: T_UserId
  author: string
  text: string
}

export interface I_RoomUser {
  userId: T_UserId
  socketId: T_SocketId
}

export interface I_RoomMessage {
  id: string
  authorId: T_UserId
  author: string
  text: string
  type: E_RoomMessageType
}

export interface I_PreviewRoom {
  id: T_RoomId
  authorId: T_UserId
  name: string
  size: number
  currentSize: number
  type: E_RoomType
  users: I_RoomUser[]
}

export interface I_FullRoom extends I_PreviewRoom {
  password: string
  messages: I_RoomMessage[]
}
