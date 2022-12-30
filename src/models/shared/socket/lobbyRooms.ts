import {
  E_RoomType,
  E_StatusServerMessage,
  I_FullRoom,
  I_RoomMessage,
  I_PreviewRoom,
  T_LocaleText,
  T_RoomId,
  T_UserId,
} from 'models/shared/app'
import { E_Field } from 'models/shared/game/battlefield'
import {
  I_Character,
  T_BaseCharacterBar,
  T_BaseCharacterEffect,
  T_BaseCharacterSpecial,
  T_CharacterAction,
  T_CharacterId,
} from 'models/shared/game/character'
import { T_BaseDummy, T_Dummy, T_DummyId } from 'models/shared/game/dummy'

export enum E_Subscribe {
  getPreviewRooms = 'getPreviewRooms',
  getPreviewRoom = 'getPreviewRoom',
  getFullRoom = 'getFullRoom',
  getFullRoomRejoin = 'getFullRoomRejoin',
  getRoomChat = 'getRoomChat',
  getRoomMessage = 'getRoomMessage',

  // Characters Window
  getCharactersWindowSettingsBars = 'getCharactersWindowSettingsBars',
  getCharactersWindowSettingsSpecials = 'getCharactersWindowSettingsSpecials',
  getCharactersWindowSettingsEffects = 'getCharactersWindowSettingsEffects',

  getCreatedCharacterInCharactersWindow = 'getCreatedCharacterInCharactersWindow',
  getUpdatedCharacterInCharactersWindow = 'getUpdatedCharacterInCharactersWindow',
  getRemovedCharacterInCharactersWindow = 'getRemovedCharacterInCharactersWindow',

  // Battlefield Window
  getCreatedDummyInBattlefieldWindow = 'getCreatedDummyInBattlefieldWindow',
  getDummiesOnFieldInBattlefieldWindow = 'getDummiesOnFieldInBattlefieldWindow',
  getInitiationActionInBattlefieldWindow = 'getInitiationActionInBattlefieldWindow',
  getUpdatedDummyInBattlefieldWindow = 'getUpdatedDummyInBattlefieldWindow',
  getRemovedDummyInBattlefieldWindow = 'getRemovedDummyInBattlefieldWindow',
}

export interface I_SubscriptionData {
  [E_Subscribe.getPreviewRooms]: { previewRooms: I_PreviewRoom[] }
  [E_Subscribe.getPreviewRoom]: { previewRoom: I_PreviewRoom }
  [E_Subscribe.getFullRoom]: {
    fullRoom?: I_FullRoom
    status?: E_StatusServerMessage
    message?: T_LocaleText
  }
  [E_Subscribe.getFullRoomRejoin]: {
    fullRoom: I_FullRoom
  }
  [E_Subscribe.getRoomChat]: { messages: I_RoomMessage[] }
  [E_Subscribe.getRoomMessage]: { message: I_RoomMessage }

  // Characters Window
  [E_Subscribe.getCharactersWindowSettingsBars]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    bars: T_BaseCharacterBar[]
    characters: I_Character[]
    playersDummies: T_BaseDummy[]
    masterDummies: T_BaseDummy[]
  }
  [E_Subscribe.getCharactersWindowSettingsSpecials]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    specials: T_BaseCharacterSpecial[]
    characters: I_Character[]
  }
  [E_Subscribe.getCharactersWindowSettingsEffects]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    effects: T_BaseCharacterEffect[]
    characters: I_Character[]
  }
  [E_Subscribe.getCreatedCharacterInCharactersWindow]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    character: I_Character
  }
  [E_Subscribe.getUpdatedCharacterInCharactersWindow]: {
    character: I_Character
  }
  [E_Subscribe.getRemovedCharacterInCharactersWindow]: {
    characterId: T_CharacterId
  }

  // Battlefield
  [E_Subscribe.getCreatedDummyInBattlefieldWindow]: {
    dummy: T_BaseDummy
    field: E_Field
  }
  [E_Subscribe.getDummiesOnFieldInBattlefieldWindow]: {
    dummies: T_Dummy[]
    field: E_Field
  }
  [E_Subscribe.getInitiationActionInBattlefieldWindow]: {
    to: { id: T_DummyId | T_CharacterId }
    from: { id: T_DummyId | T_CharacterId }
    characters: I_Character[]
    masterField: T_Dummy[]
    playersField: T_Dummy[]
  }
  [E_Subscribe.getUpdatedDummyInBattlefieldWindow]: {
    dummy: T_BaseDummy
    field: E_Field
  }
  [E_Subscribe.getRemovedDummyInBattlefieldWindow]: {
    dummyId: T_DummyId
    field: E_Field
  }
}

export enum E_Emit {
  requestPreviewRooms = 'requestPreviewRooms',
  createRoom = 'createRoom',
  joinRoom = 'joinRoom',
  rejoinRoom = 'rejoinRoom',
  leaveRoom = 'leaveRoom',
  requestRoomMessages = 'requestRoomMessages',
  sendMessageRoom = 'sendMessageRoom',

  // Characters Window
  updateCharactersWindowSettingsBars = 'updateCharactersWindowSettingsBars',
  updateCharactersWindowSettingsSpecials = 'updateCharactersWindowSettingsSpecials',
  updateCharactersWindowSettingsEffects = 'updateCharactersWindowSettingsEffects',

  createCharacterInCharactersWindow = 'createCharacterInCharactersWindow',
  updateCharacterInCharactersWindow = 'updateCharacterInCharactersWindow',
  updateCharacterFieldInCharactersWindow = 'updateCharacterFieldInCharactersWindow',
  removeCharacterInCharactersWindow = 'removeCharacterInCharactersWindow',

  // Battlefield Window
  createDummyInBattlefieldWindow = 'createDummyInBattlefieldWindow',
  addDummyToFieldInBattlefieldWindow = 'addDummyToFieldInBattlefieldWindow',
  makeActionInBattlefieldWindow = 'makeActionInBattlefieldWindow',
  updateDummyFieldInBattlefieldWindow = 'updateDummyFieldInBattlefieldWindow',
  updateDummyInBattlefieldWindow = 'updateDummyInBattlefieldWindow',
  updateDummyFieldOnFieldInBattlefieldWindow = 'updateDummyFieldOnBattlefieldWindow',
  removeDummyInBattlefieldWindow = 'removeDummyInBattlefieldWindow',
  removeDummyOnFieldInBattlefieldWindow = 'removeDummyOnFieldInBattlefieldWindow',
  removeDummiesOnFieldInBattlefieldWindow = 'removeDummiesOnFieldInBattlefieldWindow',
}

export interface I_EmitPayload {
  [E_Emit.requestPreviewRooms]: null
  [E_Emit.createRoom]: {
    roomName: string
    roomSize: number
    roomPassword: string
    roomType: E_RoomType
  }
  [E_Emit.joinRoom]: {
    roomId: T_RoomId
    password?: string
  }
  [E_Emit.rejoinRoom]: {
    userId: T_UserId
  }
  [E_Emit.leaveRoom]: {
    roomId: T_RoomId
  }
  [E_Emit.requestRoomMessages]: {
    roomId: T_RoomId
  }
  [E_Emit.sendMessageRoom]: {
    roomId: T_RoomId
    text: string
  }

  // Characters Window
  [E_Emit.updateCharactersWindowSettingsBars]: {
    roomId: T_RoomId
    bars: T_BaseCharacterBar[]
  }
  [E_Emit.updateCharactersWindowSettingsSpecials]: {
    roomId: T_RoomId
    specials: T_BaseCharacterSpecial[]
  }
  [E_Emit.updateCharactersWindowSettingsEffects]: {
    roomId: T_RoomId
    effects: T_BaseCharacterEffect[]
  }
  [E_Emit.createCharacterInCharactersWindow]: {
    roomId: T_RoomId
    character: I_Character
  }
  [E_Emit.updateCharacterInCharactersWindow]: {
    roomId: T_RoomId
    character: I_Character
  }
  [E_Emit.updateCharacterFieldInCharactersWindow]: {
    roomId: T_RoomId
    characterId: string
    field: string
    subFieldId?: string
    value: string | number
  }
  [E_Emit.removeCharacterInCharactersWindow]: {
    roomId: T_RoomId
    characterId: string
  }

  // Battlefield window
  [E_Emit.createDummyInBattlefieldWindow]: {
    roomId: T_RoomId
    field: E_Field
    dummy: T_BaseDummy
  }
  [E_Emit.addDummyToFieldInBattlefieldWindow]: {
    roomId: T_RoomId
    field: E_Field
    dummy: T_BaseDummy
  }
  [E_Emit.makeActionInBattlefieldWindow]: {
    roomId: T_RoomId
    actionTarget: T_DummyId | T_CharacterId
    actionInitiator: T_DummyId | T_CharacterId
    action: T_CharacterAction
  }
  [E_Emit.updateDummyFieldInBattlefieldWindow]: {
    roomId: T_RoomId
    dummyId: T_DummyId
    battlefield: E_Field
    field: string
    value: string | number
    subFieldId?: string
  }
  [E_Emit.updateDummyInBattlefieldWindow]: {
    roomId: T_RoomId
    field: E_Field
    dummy: T_BaseDummy
  }
  [E_Emit.updateDummyFieldOnFieldInBattlefieldWindow]: {
    roomId: T_RoomId
    dummySubId: string
    field: string
    battlefield: E_Field
    subFieldId?: string
    value: string
  }
  [E_Emit.removeDummyInBattlefieldWindow]: {
    roomId: T_RoomId
    dummyId: T_DummyId
    field: E_Field
  }
  [E_Emit.removeDummiesOnFieldInBattlefieldWindow]: {
    roomId: T_RoomId
    dummyId: T_DummyId
    field: E_Field
  }
  [E_Emit.removeDummyOnFieldInBattlefieldWindow]: {
    roomId: T_RoomId
    dummySubId: string
    field: E_Field
  }
}
