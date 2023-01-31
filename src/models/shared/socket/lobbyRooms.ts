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
import { E_Battlefield } from 'models/shared/game/battlefield'
import {
  I_Character,
  T_BaseCharacterBar,
  T_BaseCharacterEffect,
  T_BaseCharacterSpecial,
  T_CharacterAction,
  T_CharacterId,
} from 'models/shared/game/character'
import { T_BaseDummy, T_Dummy, T_DummyId } from 'models/shared/game/dummy'
import { I_Doc, T_DocId } from 'models/shared/game/textEditor'

export enum E_Subscribe {
  getPreviewRooms = 'getPreviewRooms',
  getPreviewRoom = 'getPreviewRoom',
  getFullRoom = 'getFullRoom',
  getFullRoomRejoin = 'getFullRoomRejoin',
  getRoomChat = 'getRoomChat',
  getRoomMessage = 'getRoomMessage',

  getSettingsBars = 'getSettingsBars',

  // Characters Window
  getCharactersSettingsSpecials = 'getCharactersSettingsSpecials',
  getCharactersSettingsEffects = 'getCharactersSettingsEffects',

  getCreatedCharacter = 'getCreatedCharacter',
  getUpdatedCharacter = 'getUpdatedCharacter',
  getRemovedCharacter = 'getRemovedCharacter',

  // Battlefield Window
  getCreatedDummy = 'getCreatedDummy',
  getDummiesOnBattlefield = 'getDummiesOnBattlefield',
  getInitiationActionOnBattlefield = 'getInitiationActionOnBattlefield',
  getUpdatedDummy = 'getUpdatedDummy',
  getRemovedDummy = 'getRemovedDummy',

  // TextEditor Window
  getCreatedDoc = 'getCreatedDoc',
  getRemovedDoc = 'getRemovedDoc',
  getUpdatedDoc = 'getUpdatedDoc',
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
  [E_Subscribe.getSettingsBars]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    bars: T_BaseCharacterBar[]
    characters: I_Character[]
    playersDummies: T_BaseDummy[]
    masterDummies: T_BaseDummy[]
  }
  [E_Subscribe.getCharactersSettingsSpecials]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    specials: T_BaseCharacterSpecial[]
    characters: I_Character[]
  }
  [E_Subscribe.getCharactersSettingsEffects]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    effects: T_BaseCharacterEffect[]
    characters: I_Character[]
  }
  [E_Subscribe.getCreatedCharacter]: {
    message: T_LocaleText
    status: E_StatusServerMessage
    character: I_Character
  }
  [E_Subscribe.getUpdatedCharacter]: {
    character: I_Character
  }
  [E_Subscribe.getRemovedCharacter]: {
    characterId: T_CharacterId
  }

  // Battlefield
  [E_Subscribe.getCreatedDummy]: {
    dummy: T_BaseDummy
    battlefield: E_Battlefield
  }
  [E_Subscribe.getDummiesOnBattlefield]: {
    dummies: T_Dummy[]
    battlefield: E_Battlefield
  }
  [E_Subscribe.getInitiationActionOnBattlefield]: {
    to: { id: T_DummyId | T_CharacterId }
    from: { id: T_DummyId | T_CharacterId }
    characters: I_Character[]
    masterField: T_Dummy[]
    playersField: T_Dummy[]
  }
  [E_Subscribe.getUpdatedDummy]: {
    dummy: T_BaseDummy
    battlefield: E_Battlefield
  }
  [E_Subscribe.getRemovedDummy]: {
    dummyId: T_DummyId
    battlefield: E_Battlefield
  }

  [E_Subscribe.getCreatedDoc]: {
    doc: I_Doc
  }
  [E_Subscribe.getRemovedDoc]: {
    docId: T_DocId
  }
  [E_Subscribe.getUpdatedDoc]: {
    doc: I_Doc
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

  // Global settings
  updateSettingsBars = 'updateSettingsBars',

  // Characters Window
  updateCharactersSettingsSpecials = 'updateCharactersSettingsSpecials',
  updateCharactersSettingsEffects = 'updateCharactersSettingsEffects',

  createCharacter = 'createCharacter',
  updateCharacter = 'updateCharacter',
  updateCharacterField = 'updateCharacterField',
  removeCharacter = 'removeCharacter',

  // Battlefield Window
  createDummy = 'createDummy',
  addDummyToBattlefield = 'addDummyToBattlefield',
  makeActionInBattlefield = 'makeActionInBattlefield',
  updateDummyField = 'updateDummyField',
  updateDummy = 'updateDummy',
  updateDummyFieldOnBattlefield = 'updateDummyFieldOnBattlefield',
  removeDummy = 'removeDummy',
  removeDummyOnBattlefield = 'removeDummyOnBattlefield',
  removeDummiesOnBattlefield = 'removeDummiesOnBattlefield',

  // TextEditor Window
  createDoc = 'createDoc',
  removeDoc = 'removeDoc',
  updateDoc = 'updateDoc',
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

  [E_Emit.updateSettingsBars]: {
    roomId: T_RoomId
    bars: T_BaseCharacterBar[]
  }

  // Characters Window
  [E_Emit.updateCharactersSettingsSpecials]: {
    roomId: T_RoomId
    specials: T_BaseCharacterSpecial[]
  }
  [E_Emit.updateCharactersSettingsEffects]: {
    roomId: T_RoomId
    effects: T_BaseCharacterEffect[]
  }
  [E_Emit.createCharacter]: {
    roomId: T_RoomId
    character: I_Character
  }
  [E_Emit.updateCharacter]: {
    roomId: T_RoomId
    character: I_Character
  }
  [E_Emit.updateCharacterField]: {
    roomId: T_RoomId
    characterId: string
    field: string
    subFieldId?: string
    value: string | number
  }
  [E_Emit.removeCharacter]: {
    roomId: T_RoomId
    characterId: string
  }

  // Battlefield window
  [E_Emit.createDummy]: {
    roomId: T_RoomId
    battlefield: E_Battlefield
    dummy: T_BaseDummy
  }
  [E_Emit.addDummyToBattlefield]: {
    roomId: T_RoomId
    battlefield: E_Battlefield
    dummy: T_BaseDummy
  }
  [E_Emit.makeActionInBattlefield]: {
    roomId: T_RoomId
    actionTarget: T_DummyId | T_CharacterId
    actionInitiator: T_DummyId | T_CharacterId
    action: T_CharacterAction
  }
  [E_Emit.updateDummyField]: {
    roomId: T_RoomId
    dummyId: T_DummyId
    battlefield: E_Battlefield
    field: string
    value: string | number
    subFieldId?: string
  }
  [E_Emit.updateDummy]: {
    roomId: T_RoomId
    battlefield: E_Battlefield
    dummy: T_BaseDummy
  }
  [E_Emit.updateDummyFieldOnBattlefield]: {
    roomId: T_RoomId
    dummySubId: string
    field: string
    battlefield: E_Battlefield
    subFieldId?: string
    value: number
  }
  [E_Emit.removeDummy]: {
    roomId: T_RoomId
    dummyId: T_DummyId
    battlefield: E_Battlefield
  }
  [E_Emit.removeDummyOnBattlefield]: {
    roomId: T_RoomId
    dummySubId: string
    battlefield: E_Battlefield
  }
  [E_Emit.removeDummiesOnBattlefield]: {
    roomId: T_RoomId
    dummyId: T_DummyId
    battlefield: E_Battlefield
  }
  [E_Emit.createDoc]: {
    roomId: T_RoomId
    title: string
    description: string
  }
  [E_Emit.removeDoc]: {
    roomId: T_RoomId
    docId: T_DocId
  }
  [E_Emit.updateDoc]: {
    roomId: T_RoomId
    docId: T_DocId
    field: string
    value: string
  }
}
