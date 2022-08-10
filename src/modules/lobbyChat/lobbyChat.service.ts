import { Injectable } from '@nestjs/common'
import { v4 } from 'uuid'

import { LobbyChat, LobbyUser } from 'models/app'

@Injectable()
export class LobbyChatService {
  chat: LobbyChat[] = [{ author: 'xep', authorId: 111, id: '123', text: 'xep' }]

  getAll(): LobbyChat[] {
    return this.chat
  }

  create(user: LobbyUser, text: string): LobbyChat {
    const messageId = v4()
    const message: LobbyChat = {
      id: messageId,
      authorId: user.id,
      author: user.nickname,
      text,
    }

    this.chat.push(message)

    return message
  }
}
