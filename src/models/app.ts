export type T_SocketId = string
export type T_UserId = number
export type T_RoomId = string
export type T_AccessToken = string

export enum UserStatusEnum {
  offline = 'offline',
  online = 'online',
  inRoom = 'inRoom',
}
export enum RoomTypeEnum {
  public = 'PUBLIC',
  private = 'PRIVATE',
}
export enum RoomMessageTypeEnum {
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

export type T_LocaleServerMessage = Record<E_Locale, string>

export enum E_StatusServerMessage {
  success = 'success',
  error = 'error',
  info = 'info',
}

export interface Profile {
  id: T_UserId
  email: string
  nickname: string
  statuses: {
    isAuth: boolean
    inRoom: boolean
  }
}

export interface Lobby {
  users: LobbyUser[]
  chat: LobbyChat[]
  rooms: PreviewRoom[]
}

export interface LobbyUser {
  socketId: T_SocketId
  id: T_UserId
  nickname: string
  status: UserStatusEnum
}

export interface LobbyChat {
  id: string
  authorId: T_UserId
  author: string
  text: string
}

export interface RoomUser {
  [id: T_UserId]: T_SocketId
}

export interface RoomChat {
  id: string
  authorId: T_UserId
  author: string
  text: string
  type: RoomMessageTypeEnum
}

export interface PreviewRoom {
  id: T_RoomId
  authorId: T_UserId
  name: string
  size: number
  currentSize: number
  type: RoomTypeEnum
  users: RoomUser[]
}

export interface FullRoom extends PreviewRoom {
  password: string
  messages: RoomChat[]
}
