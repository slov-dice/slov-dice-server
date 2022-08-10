import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Socket, Server } from 'socket.io'

import { UsersService } from 'modules/users/users.service'
import { MailService } from 'modules/mail/mail.service'
import { E_AuthType, T_SocketId } from 'models/app'
import {
  E_AuthEmit,
  E_AuthSubscribe,
  I_EmitPayload,
  I_SubscriptionData,
} from 'models/socket/auth'
import { t } from 'languages'

@WebSocketGateway({ cors: true })
export class AuthGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  restoreSessions: Record<T_SocketId, { email: string; code: string }> = {}

  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('AuthGateway')

  async afterInit() {
    this.logger.log('Init AuthGateway')
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected AuthGateway: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  // Проверка почты и отправка кода для восстановления пароля
  @SubscribeMessage(E_AuthEmit.restoreCheckEmail)
  async restoreCheckEmail(
    client: Socket,
    data: I_EmitPayload[E_AuthEmit.restoreCheckEmail],
  ) {
    const user = await this.usersService.findUnique('email', data.email)
    const payload: I_SubscriptionData[E_AuthSubscribe.getRestoreCheckEmail] = {
      message: { EN: '', RU: '' },
      isSuccess: false,
    }

    // Если пользователь не найден
    if (!user) {
      payload.message = t('auth.error.userNotFound')
      client.emit(E_AuthSubscribe.getRestoreCheckEmail, payload)
      return
    }

    // Если пользователь не зарегистрирован по email
    if (user.from !== E_AuthType.email) {
      payload.message = t('auth.error.userRegisteredByThirdParty')
      client.emit(E_AuthSubscribe.getRestoreCheckEmail, payload)
      return
    }

    // Генерируем код
    const code = String(~~(Math.random() * (9999 - 1000) + 1000))

    // Создаём привязку
    this.restoreSessions[client.id] = {
      email: user.email,
      code,
    }

    // Отправляем письмо с кодом
    this.mailService.sendUserRestorePassword(user, code)

    // Оповещаем юзера об успешной отправке
    payload.isSuccess = true
    payload.message = t('auth.success.checkEmail')
    client.emit(E_AuthSubscribe.getRestoreCheckEmail, payload)

    console.log(this.restoreSessions)
  }
}
