import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'

import { E_Locale } from 'models/shared/app'

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  sendUserConfirmation(user: User, token: string, language: E_Locale) {
    const url = `${this.config.get('CLIENT_URL')}/verification?token=${token}`

    const subject: Record<E_Locale, string> = {
      EN: 'Welcome! Confirm your email.',
      RU: 'Добро пожаловать! Подтвердите свою почту.',
    }

    return this.mailerService.sendMail({
      to: user.email,
      from: '"Slov Dice" <slov-dice@outlook.com>',
      subject: subject[language],
      template: `verification-${language.toLocaleLowerCase()}`,
      context: {
        nickname: user.nickname,
        url,
      },
    })
  }

  sendUserRestorePassword(user: User, code: string) {
    return this.mailerService.sendMail({
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
