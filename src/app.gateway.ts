import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

interface IUser {
  id: string;
  nickname: string;
}

interface IMessage {
  id: string;
  author: string;
  text: string;
}

interface ILobby {
  users: IUser[];
  messages: IMessage[];
}

@WebSocketGateway()
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');

  lobbyState: ILobby = {
    users: [],
    messages: [],
  };

  @SubscribeMessage('SEND_MESSAGE')
  handleMessage(client: Socket, payload: any): void {
    console.log(client.id, payload);
    const message = {
      id: String(Math.random()),
      authorId: payload.id,
      author: payload.nickname,
      text: payload.text,
    };
    this.lobbyState.messages.push(message);
    this.server.emit('GET_MESSAGE', message);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.lobbyState.users = this.lobbyState.users.filter(
      (user) => user.id !== client.id,
    );
    this.server.emit(`USER_DISCONNECTED`, this.lobbyState.users);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    const newClientId = client.id;
    const newClient = {
      id: newClientId,
      nickname: `babyBoy-${newClientId[0] + newClientId[1] + newClientId[2]}`,
    };
    const { users, messages } = this.lobbyState;
    users.push(newClient);

    this.server.emit(`USER_CONNECTED`, users);
    this.server.emit(`GET_PROFILE`, newClient, messages);
  }
}
