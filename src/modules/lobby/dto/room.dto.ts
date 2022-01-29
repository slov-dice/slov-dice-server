export type CreateRoomDto = [RoomName, RoomSize, RoomPassword, RoomType];

export type JoinRoomDto = [RoomId, RoomPassword];

export type RejoinRoomDto = [ProfileId, RoomId];

type ProfileId = number;
type RoomId = string;
type RoomName = string;
type RoomSize = number;
type RoomPassword = string;

export enum RoomType {
  public = 'PUBLIC',
  private = 'PRIVATE',
}
