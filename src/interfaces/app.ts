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
  users: IUser[];
  messages: IMessage[];
  rooms: IRoom[];
}

export interface IUser {
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
  currentSize: number;
  users: IUser[];
  messages: IMessage[];
}
