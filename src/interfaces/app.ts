import { RoomType } from 'modules/lobby/dto/room.dto';

export interface IProfile {
  id: number;
  socketId: string;
  nickname: string;
  statuses: {
    isAuth: boolean;
    inArea: boolean;
  };
}

export interface ILobby {
  users: LobbyUser[];
  messages: IMessage[];
  rooms: IRoom[];
}

export interface LobbyUser {
  socketId: string;
  id: number;
  nickname: string;
  status: 'offline' | 'online';
}

export interface IMessage {
  id: string;
  author: string;
  text: string;
}

export interface IRoom {
  id: string;
  authorId: number;
  name: string;
  size: number;
  type: RoomType;
  password: string;
  currentSize: number;
  users: LobbyUser[];
  messages: IMessage[];
}
