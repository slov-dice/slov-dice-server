import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { UsersService } from 'modules/users/users.service'
import { TokenData } from 'modules/auth/models/tokens.type'

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // TODO: Типизируй меня и пойми
  async canActivate(context: ExecutionContext): Promise<any> {
    try {
      const bearerToken = context.switchToWs().getData().accessToken
      if (!bearerToken) return false

      const tokenData: TokenData = this.jwtService.verify(bearerToken, {
        secret: this.config.get('JWT_SECRET_AT'),
      })
      if (!tokenData) return false

      const user = await this.usersService.findUnique('id', tokenData.sub)
      if (!user) return false
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
