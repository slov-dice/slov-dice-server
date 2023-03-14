import { T_RoomId, T_UserId } from 'models/shared/app'
import { E_Battlefield } from 'models/shared/game/battlefield'
import { T_CharacterAction, T_CharacterId } from 'models/shared/game/character'
import { T_BaseDummy, T_DummyId } from 'models/shared/game/dummy'

export interface I_CreateDummy {
  roomId: T_RoomId
  dummy: T_BaseDummy
  battlefield: E_Battlefield
}

export interface I_AddDummyToBattlefield {
  roomId: T_RoomId
  dummy: T_BaseDummy
  battlefield: E_Battlefield
}

export interface I_MakeAction {
  roomId: T_RoomId
  action: T_CharacterAction
  actionTarget: T_DummyId | T_CharacterId
  actionInitiator: T_DummyId | T_CharacterId
  userId: T_UserId
}

export interface I_UpdateDummyField {
  roomId: T_RoomId
  dummyId: T_DummyId
  field: string
  value: string | number
  battlefield: E_Battlefield
  subFieldId?: string
}

export interface I_UpdateDummy {
  roomId: T_RoomId
  dummy: T_BaseDummy
  battlefield: E_Battlefield
}

export interface I_UpdateDummyFieldOnBattlefield {
  roomId: T_RoomId
  battlefield: E_Battlefield
  field: string
  dummySubId: string
  value: number
  subFieldId: string
}

export interface I_RemoveDummiesFromBattlefield {
  roomId: T_RoomId
  dummyId: T_DummyId
  battlefield: E_Battlefield
}

export interface I_RemoveDummy {
  roomId: T_RoomId
  dummyId: T_DummyId
  battlefield: E_Battlefield
}

export interface I_RemoveDummyFromBattlefield {
  roomId: T_RoomId
  dummySubId: string
  battlefield: E_Battlefield
}
