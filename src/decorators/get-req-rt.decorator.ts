import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetReqRT = createParamDecorator(
  (data: undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    console.log(req);
    return req.cookies.refresh_token;
  },
);
