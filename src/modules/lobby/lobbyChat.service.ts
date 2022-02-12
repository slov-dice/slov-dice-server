import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { LobbyChat, LobbyUser } from 'interfaces/app';

@Injectable()
export class LobbyChatService {
  chat: LobbyChat[] = [];

  getAll(): LobbyChat[] {
    return this.chat;
  }

  create(user: LobbyUser, text: string): LobbyChat {
    const messageId = uuidv4();
    const message: LobbyChat = {
      id: messageId,
      authorId: user.id,
      author: user.nickname,
      text,
    };

    this.chat.push(message);

    return message;
  }
}
