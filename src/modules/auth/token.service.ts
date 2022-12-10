import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { T_Tokens } from './models/response.model'

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService, private config: ConfigService) {}

  async generateTokens(userId: number, email: string): Promise<T_Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.config.get('JWT_SECRET_AT'),
          expiresIn: 10 * 60, // 10 минут
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.config.get('JWT_SECRET_RT'),
          expiresIn: 60 * 60 * 24 * 7, // неделя
        },
      ),
    ])

    return {
      accessToken: at,
      refreshToken: rt,
    }
  }

  async generateMailToken(userId: number, email: string): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.config.get('JWT_SECRET_MAIL'),
        expiresIn: 60 * 60, // 1 час
      },
    )
  }
}
