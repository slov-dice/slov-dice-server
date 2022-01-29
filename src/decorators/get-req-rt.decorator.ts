import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetReqRT = createParamDecorator(
  (data: undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    return req.cookies.refresh_token;
  },
);
