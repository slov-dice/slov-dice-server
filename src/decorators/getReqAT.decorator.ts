import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetReqAT = createParamDecorator(
  (data: undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest()
    return req.cookies.access_token
  },
)
