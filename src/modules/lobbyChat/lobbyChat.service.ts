import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import { I_LobbyChat, I_LobbyUser } from 'models/app'

@Injectable()
export class LobbyChatService {
  chat: I_LobbyChat[] = [
    { author: 'xep', authorId: 111, id: '123', text: 'xep' },
  ]

  getAll(): I_LobbyChat[] {
    return this.chat
  }

  create(user: I_LobbyUser, text: string): I_LobbyChat {
    const messageId = v4()
    const message: I_LobbyChat = {
      id: messageId,
      authorId: user.id,
      author: user.nickname,
      text,
    }

    this.chat.push(message)

    return message
  }
}
