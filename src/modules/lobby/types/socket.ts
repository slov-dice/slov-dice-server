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
