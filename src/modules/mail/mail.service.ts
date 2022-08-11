import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendUserConfirmation(user: User, token: string) {
    const url = `${this.config.get(
      'CLIENT_SERVER',
    )}/verification?token=${token}`

    await this.mailerService.sendMail({
      to: user.email,
      from: '"Slov Dice" <slov-dice@outlook.com>',
      subject: 'Добро пожаловать! Подтвердите свою почту.',
      template: 'verification',
      context: {
        nickname: user.nickname,
        url,
      },
    })
  }

  async sendUserRestorePassword(user: User, code: string) {
    await this.mailerService.sendMail({
      to: user.email,
      from: '"Slov Dice" <slov-dice@outlook.com>',
      subject: 'Восстановление пароля.',
      template: 'restore',
      context: {
        nickname: user.nickname,
        code,
      },
    })
  }
}
