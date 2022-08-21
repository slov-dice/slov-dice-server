import { I_LobbyUser, T_UserId } from 'models/app'

export enum E_Subscribe {
  getLobbyUsers = 'getLobbyUsers',
  getUpdatedLobbyUser = 'getUpdatedLobbyUser',
}

export interface I_SubscriptionData {
  [E_Subscribe.getLobbyUsers]: { users: I_LobbyUser[] }
  [E_Subscribe.getUpdatedLobbyUser]: { user: I_LobbyUser }
}

export enum E_Emit {
  requestLobbyUsers = 'requestLobbyUsers',
  setLobbyUserOnline = 'setLobbyUserOnline',
  logoutLobbyUser = 'logoutLobbyUser',
}

export interface I_EmitPayload {
  [E_Emit.requestLobbyUsers]: null
  [E_Emit.setLobbyUserOnline]: { userId: T_UserId }
  [E_Emit.logoutLobbyUser]: null
}
