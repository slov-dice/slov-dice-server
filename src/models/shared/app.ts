import { I_Character, I_CharactersSettings } from './game/character'
import { T_BaseDummy, T_Dummy } from './game/dummy'
import { I_Doc } from './game/textEditor'

export type T_SocketId = string
export type T_UserId = number
export type T_RoomId = string
export type T_AccessToken = string
export type T_RefreshToken = string

export type T_Tokens = {
  accessToken: string
  refreshToken: string
}

export type T_TokenData = {
  sub: string
  email: string
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

export enum E_ChatType {
  lobby = 'LOBBY',
  room = 'ROOM',
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

export type T_LocaleText = Record<E_Locale, string>

export type T_SocketDataStatus = {
  message: T_LocaleText
  status: E_StatusServerMessage
}

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
  command?: string
}

export interface I_PreviewRoom {
  id: T_RoomId
  authorId: T_UserId
  name: string
  size: number
  currentSize: number
  type: E_RoomType
  users: I_RoomUser[]
  updatedAt: Date
  createdAt: Date
}

export type I_FullRoomGame = {
  characters: {
    window: {
      characters: I_Character[]
    }
    settings: I_CharactersSettings
  }
  battlefield: {
    window: {
      masterField: T_Dummy[]
      playersField: T_Dummy[]
      masterDummies: T_BaseDummy[]
      playersDummies: T_BaseDummy[]
    }
  }
  textEditor: {
    window: {
      docs: I_Doc[]
    }
  }
}

export interface I_FullRoom extends I_PreviewRoom {
  password: string
  messages: I_RoomMessage[]
  game: I_FullRoomGame
}
