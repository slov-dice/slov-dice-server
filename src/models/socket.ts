import {
  T_AccessToken,
  FullRoom,
  LobbyChat,
  LobbyUser,
  PreviewRoom,
  RoomChat,
  T_RoomId,
  RoomTypeEnum,
  T_UserId,
} from './app'

export enum SubscribeNamespace {
  // CHAT
  // Запрос на получение всех сообщений в лобби
  requestAllMessagesLobby = 'request_all_messages_lobby',

  // Отправка сообщения в лобби
  sendMessageLobby = 'send_message_lobby',

  // USERS
  // Запрос на получение всех пользователей в лобби
  requestAllUsersLobby = 'request_all_users_lobby',

  // Меняет статус пользователя на "онлайн"
  setUserOnline = 'set_user_online',

  // Выход юзера из профиля
  requestUserLogout = 'request_user_logout',

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
  // CHAT
  [SubscribeNamespace.requestAllMessagesLobby]: { accessToken: T_AccessToken }
  [SubscribeNamespace.sendMessageLobby]: { text: string }

  // USERS
  [SubscribeNamespace.requestAllUsersLobby]: { accessToken: T_AccessToken }
  [SubscribeNamespace.setUserOnline]: {
    userId: T_UserId
    accessToken: T_AccessToken
  }
  [SubscribeNamespace.requestUserLogout]: { roomId: T_RoomId }

  [SubscribeNamespace.rejoinRoom]: { profileId: T_UserId; roomId: T_RoomId }
  [SubscribeNamespace.leaveRoom]: { roomId: T_RoomId }
  [SubscribeNamespace.joinRoom]: { roomId: T_RoomId; password: string }
  [SubscribeNamespace.createRoom]: {
    roomName: string
    roomSize: number
    roomPassword: string
    roomType: RoomTypeEnum
  }
  [SubscribeNamespace.sendMessageRoom]: { roomId: T_RoomId; message: string }
}

export enum EmitNamespace {
  // CHAT
  // Получение всех сообщений в лобби
  getAllMessagesLobby = 'get_all_messages_lobby',

  // Получение нового сообщения в лобби
  getMessageLobby = 'get_message_lobby',

  // USERS
  // Поучение всех пользователей в лобби
  getAllUsersLobby = 'get_all_users_lobby',

  // Получение пользователя
  getUserLobby = 'get_user_lobby',

  // Пользователь отключился
  userDisconnected = 'user_disconnected',

  // Комната обновилась в лобби
  roomUpdated = 'room_updated',

  // Обновление внутри комнаты
  inRoomUpdate = 'in_room_update',

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
  // CHAT
  [EmitNamespace.getAllMessagesLobby]: { chat: LobbyChat[] }
  [EmitNamespace.getMessageLobby]: { message: LobbyChat }

  // USERS
  [EmitNamespace.getAllUsersLobby]: { users: LobbyUser[] }
  [EmitNamespace.getUserLobby]: { user: LobbyUser }

  [EmitNamespace.userDisconnected]: { user: LobbyUser }
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
