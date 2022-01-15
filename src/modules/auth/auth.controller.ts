import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { AuthRes } from './types/response.type';
import { RtGuard } from 'guards';
import { GetCurrentUserId, Public } from 'decorators';
import { GetReqRT } from 'decorators/get-req-rt.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signUpLocal(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    return this.authService.signUpLocal(dto, response);
  }

  @Public()
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  signInLocal(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    return this.authService.signInLocal(dto, response);
  }

  // @Public()
  // @Get('discord/')

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetCurrentUserId() userId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(userId, response);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetReqRT() rt: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshTokens(rt, response);
  }
}
