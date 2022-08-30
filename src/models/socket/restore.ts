import { T_SocketDataStatus } from 'models/app'

export enum E_Subscribe {
  getRestoreCheckEmail = 'getRestoreCheckEmail',
  getRestoreCheckCode = 'getRestoreCheckCode',
  getRestoreChangePassword = 'getRestoreChangePassword',
}

export interface I_SubscriptionData {
  [E_Subscribe.getRestoreCheckEmail]: T_SocketDataStatus
  [E_Subscribe.getRestoreCheckCode]: T_SocketDataStatus
  [E_Subscribe.getRestoreChangePassword]: T_SocketDataStatus
}

export enum E_Emit {
  restoreCheckEmail = 'restoreCheckEmail',
  restoreCheckCode = 'restoreCheckCode',
  restoreChangePassword = 'restoreChangePassword',
}

export interface I_EmitPayload {
  [E_Emit.restoreCheckEmail]: { email: string }
  [E_Emit.restoreCheckCode]: { code: string }
  [E_Emit.restoreChangePassword]: { password: string }
}
