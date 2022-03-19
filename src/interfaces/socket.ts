import {
  AccessToken,
  FullRoom,
  Lobby,
  LobbyChat,
  LobbyUser,
  PreviewRoom,
  RoomChat,
  RoomId,
  RoomTypeEnum,
  UserId,
} from './app'

export enum SubscribeNamespace {
  // Меняет статус пользователя на "онлайн"
  setUserOnline = 'set_user_online',

  // Выход юзера из профиля
  userLogout = 'user_logout',

  // Отправка сообщения в лобби
  sendMessageLobby = 'send_message_lobby',

  // Отправка сообщения в комнате
  sendMessageRoom = 'send_message_room',

  // Создание комнаты в лобби
  createRoom = 'create_room',

  // Подключение к комнате в лобби
  joinRoom = 'join_room',

  // Переподключение к комнате
  rejoinRoom = 'rejoin_room',

  // Выход из комнаты в комнате
  leaveRoom = 'leave_room',
}

export interface SubscriptionData {
  [SubscribeNamespace.setUserOnline]: {
    userId: UserId
    accessToken: AccessToken
  }
  [SubscribeNamespace.rejoinRoom]: { profileId: UserId; roomId: RoomId }
  [SubscribeNamespace.leaveRoom]: { roomId: RoomId }
  [SubscribeNamespace.joinRoom]: { roomId: RoomId; password: string }
  [SubscribeNamespace.userLogout]: { roomId: RoomId }
  [SubscribeNamespace.sendMessageLobby]: { message: string }
  [SubscribeNamespace.createRoom]: {
    roomName: string
    roomSize: number
    roomPassword: string
    roomType: RoomTypeEnum
  }
  [SubscribeNamespace.sendMessageRoom]: { roomId: RoomId; message: string }
}

export enum EmitNamespace {
  // Получение лобби
  getLobby = 'get_lobby',

  // Получение пользователя
  getUser = 'get_user',

  // Пользователь отключился
  userDisconnected = 'user_disconnected',

  // Комната обновилась в лобби
  roomUpdated = 'room_updated',

  // Обновление внутри комнаты
  inRoomUpdate = 'in_room_update',

  // Получение сообщения в лобби
  getMessageLobby = 'get_message_lobby',

  // Получение новой комнаты в лобби
  roomCreated = 'room_created',

  // Получение комнаты
  getFullRoom = 'get_full_room',

  // Получение сообщения в комнате
  getMessageRoom = 'get_message_room',

  // Пользователь переподключается к комнате
  userRejoinInRoom = 'user_rejoin_in_room',
}

export interface EmitPayload {
  [EmitNamespace.getLobby]: { lobby: Lobby }
  [EmitNamespace.getUser]: { user: LobbyUser }
  [EmitNamespace.userDisconnected]: { user: LobbyUser }
  [EmitNamespace.getMessageLobby]: { message: LobbyChat }
  [EmitNamespace.roomCreated]: {
    previewRoom: PreviewRoom
    user: LobbyUser
  }
  [EmitNamespace.roomUpdated]: {
    previewRoom: PreviewRoom
    user: LobbyUser
  }
  [EmitNamespace.inRoomUpdate]: {
    fullRoom: FullRoom
  }
  [EmitNamespace.getMessageRoom]: {
    message: RoomChat
  }
  [EmitNamespace.userRejoinInRoom]: {
    user: LobbyUser
  }
  [EmitNamespace.getFullRoom]: {
    fullRoom: FullRoom
  }
}
