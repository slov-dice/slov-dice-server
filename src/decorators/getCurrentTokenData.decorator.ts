import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { T_TokenData } from 'models/shared/app'

export const GetCurrentTokenData = createParamDecorator(
  (_, context: ExecutionContext): T_TokenData => {
    const request = context.switchToHttp().getRequest()
    return {
      sub: request.user.sub,
      email: request.user.email,
    }
  },
)
