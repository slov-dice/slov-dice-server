import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import { I_LobbyMessage, I_LobbyUser } from 'models/app'

@Injectable()
export class LobbyChatService {
  messages: I_LobbyMessage[] = [
    { author: 'test', authorId: 111, id: '123', text: 'test' },
  ]

  getAllMessages(): I_LobbyMessage[] {
    return this.messages
  }

  create(user: I_LobbyUser, text: string): I_LobbyMessage {
    const messageId = v4()
    const message: I_LobbyMessage = {
      id: messageId,
      authorId: user.id,
      author: user.nickname,
      text,
    }

    this.messages.push(message)

    return message
  }
}
