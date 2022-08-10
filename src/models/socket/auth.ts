import { T_LocaleServerMessage } from 'models/app'

export type T_RestoreData = {
  message: T_LocaleServerMessage
  isSuccess: boolean
}

export enum E_AuthSubscribe {
  getRestoreCheckEmail = 'getRestoreCheckEmail',
  getRestoreCheckCode = 'getRestoreCheckCode',
  getRestoreChangePassword = 'getRestoreChangePassword',
}

export interface I_SubscriptionData {
  [E_AuthSubscribe.getRestoreCheckEmail]: T_RestoreData
  [E_AuthSubscribe.getRestoreCheckCode]: T_RestoreData
  [E_AuthSubscribe.getRestoreChangePassword]: T_RestoreData
}

export enum E_AuthEmit {
  restoreCheckEmail = 'restoreCheckEmail',
  restoreCheckCode = 'restoreCheckCode',
  restoreChangePassword = 'restoreChangePassword',
}

export interface I_EmitPayload {
  [E_AuthEmit.restoreCheckEmail]: { email: string }
  [E_AuthEmit.restoreCheckCode]: { code: string }
  [E_AuthEmit.restoreChangePassword]: { password: string }
}
