import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { Socket, Server } from 'socket.io'
import * as argon2 from 'argon2'

import { UsersService } from 'modules/users/users.service'
import { MailService } from 'modules/mail/mail.service'
import { E_AuthType, E_StatusServerMessage, T_SocketId } from 'models/app'
import {
  E_Emit,
  E_Subscribe,
  I_EmitPayload,
  I_SubscriptionData,
} from 'models/socket/restore'
import { t } from 'languages'
import { WsThrottlerGuard } from 'guards/wsThrottler.guard'

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

    // Если пользователь запрашивал код восстановления
    if (this.restoreSessions[client.id]) {
      // Удаляем его из списка сессий
      delete this.restoreSessions[client.id]
    }
  }

  // Проверка почты и отправка кода для восстановления пароля
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage(E_Emit.restoreCheckEmail)
  async restoreCheckEmail(
    client: Socket,
    data: I_EmitPayload[E_Emit.restoreCheckEmail],
  ) {
    const payload: I_SubscriptionData[E_Subscribe.getRestoreCheckEmail] = {
      message: { EN: '', RU: '' },
      status: E_StatusServerMessage.error,
    }

    const user = await this.usersService.findUnique('email', data.email)

    // Если пользователь не найден
    if (!user) {
      payload.message = t('auth.error.userNotFound')
      client.emit(E_Subscribe.getRestoreCheckEmail, payload)
      return
    }

    // Если пользователь не зарегистрирован по email
    if (user.from !== E_AuthType.email) {
      payload.message = t('auth.error.userRegisteredByThirdParty')
      client.emit(E_Subscribe.getRestoreCheckEmail, payload)
      return
    }

    // Если почта не верифицирована
    if (!user.verified) {
      payload.message = t('auth.error.mailNotVerified')
      client.emit(E_Subscribe.getRestoreCheckEmail, payload)
      return
    }

    // Генерируем код
    const code = String(~~(Math.random() * (9999 - 1000) + 1000))

    // Создаём|обновляем привязку
    this.restoreSessions[client.id] = {
      email: user.email,
      code,
    }

    // Отправляем письмо с кодом
    await this.mailService.sendUserRestorePassword(user, code).then(
      () => {
        // Оповещаем юзера об успешной отправке
        payload.status = E_StatusServerMessage.success
        payload.message = t('auth.success.checkEmail')
        client.emit(E_Subscribe.getRestoreCheckEmail, payload)
      },
      () => {
        // Ошибка при отправки письма
        payload.message = t('auth.error.checkEmail')
        client.emit(E_Subscribe.getRestoreCheckEmail, payload)
      },
    )
  }

  // Проверка кода
  @SubscribeMessage(E_Emit.restoreCheckCode)
  restoreCheckCode(
    client: Socket,
    data: I_EmitPayload[E_Emit.restoreCheckCode],
  ) {
    const payload: I_SubscriptionData[E_Subscribe.getRestoreCheckCode] = {
      message: { EN: '', RU: '' },
      status: E_StatusServerMessage.error,
    }

    const clientSession = this.restoreSessions[client.id]

    // Если сессия не найдена
    if (!clientSession) {
      payload.message = t('auth.error.sessionNotFound')
      client.emit(E_Subscribe.getRestoreCheckCode, payload)
      return
    }

    // Если код не валидный
    if (clientSession.code !== data.code) {
      payload.message = t('auth.error.invalidCode')
      client.emit(E_Subscribe.getRestoreCheckCode, payload)
      return
    }

    // Оповещаем юзера, что код верный
    payload.status = E_StatusServerMessage.success
    client.emit(E_Subscribe.getRestoreCheckCode, payload)
  }

  // Изменение пароля
  @SubscribeMessage(E_Emit.restoreChangePassword)
  async restoreChangePassword(
    client: Socket,
    data: I_EmitPayload[E_Emit.restoreChangePassword],
  ) {
    const payload: I_SubscriptionData[E_Subscribe.getRestoreChangePassword] = {
      message: { EN: '', RU: '' },
      status: E_StatusServerMessage.error,
    }

    const clientSession = this.restoreSessions[client.id]

    // Если сессия не найдена
    if (!clientSession) {
      payload.message = t('auth.error.sessionNotFound')
      client.emit(E_Subscribe.getRestoreChangePassword, payload)
      return
    }

    // Хешируем пароль
    const hashedPassword = await argon2.hash(data.password)

    // Изменяем пароль в бд
    await this.usersService.updatePassword(clientSession.email, hashedPassword)

    // Оповещаем юзера об успешном изменении пароля
    payload.status = E_StatusServerMessage.success
    payload.message = t('auth.success.changePassword')
    client.emit(E_Subscribe.getRestoreChangePassword, payload)

    // Удаляем сессию
    delete this.restoreSessions[client.id]
  }
}
