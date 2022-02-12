import { RoomTypeEnum } from 'interfaces/app';

export type CreateRoomDto = [RoomName, RoomSize, RoomPassword, RoomTypeEnum];

export type JoinRoomDto = [RoomId, RoomPassword];

export type RejoinRoomDto = [ProfileId, RoomId];

type ProfileId = number;
type RoomId = string;
type RoomName = string;
type RoomSize = number;
type RoomPassword = string;
