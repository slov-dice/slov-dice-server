export type SocketId = string;
export type UserId = number;
export type RoomId = string;
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

export interface Profile {
  id: UserId;
  email: string;
  nickname: string;
  statuses: {
    isAuth: boolean;
    inArea: boolean;
  };
}

export interface Lobby {
  users: LobbyUser[];
  chat: LobbyChat[];
  rooms: PreviewRoom[];
}

export interface LobbyUser {
  socketId: SocketId;
  id: UserId;
  nickname: string;
  status: UserStatusEnum;
}

export interface LobbyChat {
  id: string;
  authorId: UserId;
  author: string;
  text: string;
}

export interface RoomUser {
  [id: UserId]: SocketId;
}

export interface RoomChat {
  id: string;
  authorId: UserId;
  author: string;
  text: string;
  type: RoomMessageTypeEnum;
}

export interface PreviewRoom {
  id: RoomId;
  authorId: UserId;
  name: string;
  size: number;
  currentSize: number;
  type: RoomTypeEnum;
  users: RoomUser[];
}

export interface FullRoom extends PreviewRoom {
  password: string;
  messages: RoomChat[];
}
