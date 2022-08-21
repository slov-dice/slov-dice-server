import { E_StatusServerMessage, T_LocaleServerMessage } from 'models/app'

export type T_RestoreData = {
  message: T_LocaleServerMessage
  status: E_StatusServerMessage
}

export enum E_Subscribe {
  getRestoreCheckEmail = 'getRestoreCheckEmail',
  getRestoreCheckCode = 'getRestoreCheckCode',
  getRestoreChangePassword = 'getRestoreChangePassword',
}

export interface I_SubscriptionData {
  [E_Subscribe.getRestoreCheckEmail]: T_RestoreData
  [E_Subscribe.getRestoreCheckCode]: T_RestoreData
  [E_Subscribe.getRestoreChangePassword]: T_RestoreData
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
