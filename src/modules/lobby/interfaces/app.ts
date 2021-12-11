export interface IProfile {
  id: string;
  nickname: string;
  status: 'Offline' | 'Online';
  friends: IUser[];
  inArea: boolean;
}

export interface IUser {
  id: string;
  nickname: string;
  status: 'Offline' | 'Online';
}

export interface IMessage {
  id: string;
  author: string;
  text: string;
}

export interface IArea {
  id: string;
  authorId: string;
  name: string;
  size: number;
  currentSize: number;
  users: IUser[];
}

export interface ILobby {
  users: IUser[];
  messages: IMessage[];
  areas: IArea[];
}
