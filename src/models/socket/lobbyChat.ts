import { I_LobbyMessage } from 'models/app'

export enum E_Subscribe {
  getLobbyMessages = 'getLobbyMessages',
  getLobbyMessage = 'getLobbyMessage',
}

export interface I_SubscriptionData {
  [E_Subscribe.getLobbyMessages]: { messages: I_LobbyMessage[] }
  [E_Subscribe.getLobbyMessage]: { message: I_LobbyMessage }
}

export enum E_Emit {
  requestLobbyMessages = 'requestLobbyMessages',
  sendLobbyMessage = 'sendLobbyMessage',
}

export interface I_EmitPayload {
  [E_Emit.requestLobbyMessages]: null
  [E_Emit.sendLobbyMessage]: { text: string }
}
