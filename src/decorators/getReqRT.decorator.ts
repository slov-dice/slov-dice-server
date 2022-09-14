import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetReqRT = createParamDecorator((_, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest()
  return req.cookies.refresh_token
})
