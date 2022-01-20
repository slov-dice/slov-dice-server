import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { AuthRes } from './types/response.type';
import { GetCurrentUserId } from 'decorators';
import { GetReqRT } from 'decorators/get-req-rt.decorator';
import { DiscordGuard } from 'guards/discord.guard';
import { AtGuard } from 'guards';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signUpLocal(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    return this.authService.signUpLocal(dto, response);
  }

  @HttpCode(HttpStatus.OK)
  signInLocal(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    return this.authService.signInLocal(dto, response);
  }

  @Get('discord')
  @UseGuards(DiscordGuard)
  authDiscord(): void {
    console.log('Auth discord');
  }

  @Get('discord/redirect')
  @UseGuards(DiscordGuard)
  authDiscordCallback(@Res() res: Response) {
    res.redirect('http://localhost:3000/lobby');
    // return { redirectTo: this.config.get('DISCORD_REDIRECT_URL') };
  }

  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetCurrentUserId() userId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(userId, response);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetReqRT() rt: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshTokens(rt, response);
  }
}
