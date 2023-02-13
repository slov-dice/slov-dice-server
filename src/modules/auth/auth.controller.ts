import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'express'

import { AuthService } from './auth.service'
import { SignUpDto, SignInDto, ThirdPartyDto, EmailConfirmDto } from './dtos'
import { T_AuthResponse, T_ThirdPartyUserData } from './models/response.model'
import { TokenService } from './token.service'

import { GetCurrentTokenData, GetUserId } from 'decorators'
import { AtGuard } from 'guards'
import { T_TokenData, T_UserId } from 'models/shared/app'
import JwtRefreshGuard from 'guards/jwtRefresh.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  // Регистрация через почту
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signUpLocal(@Body() dto: SignUpDto): Promise<T_AuthResponse> {
    return this.authService.signUpLocal(dto)
  }

  // Аутентификация через почту
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  signInLocal(@Body() dto: SignInDto): Promise<T_AuthResponse> {
    return this.authService.signInLocal(dto)
  }

  // Первоначальная проверка авторизации
  @UseGuards(AtGuard)
  @Get('check')
  @HttpCode(HttpStatus.OK)
  checkAuth(@GetUserId() userId: T_UserId): Promise<T_AuthResponse> {
    return this.authService.check(userId)
  }

  // Интервальная проверка токенов
  @UseGuards(AtGuard)
  @Get('check/token')
  @HttpCode(HttpStatus.OK)
  checkAuthTokens() {
    return { message: 'ok' }
  }

  // Сторонняя авторизация
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async tokenAuth(@Body() dto: ThirdPartyDto): Promise<T_AuthResponse> {
    try {
      // Получаем токен пользователя с помощью кода
      const responseToken = await this.authService.getTokenFromThirdParty(dto)

      // Получаем юзера
      const responseUser = await this.authService.getDataFromThirdParty(
        dto.authType,
        responseToken.data.access_token,
      )

      const userData: T_ThirdPartyUserData = responseUser.data

      // Регистрируем или аутентифицируем юзера
      return this.authService.authByThirdParty(dto.authType, userData)
    } catch (error) {
      throw new ForbiddenException('Unauthorized!')
    }
  }

  // Авторизация гостем
  @Get('guest')
  @HttpCode(HttpStatus.OK)
  guestAuth(): Promise<T_AuthResponse> {
    return this.authService.guestAuth()
  }

  // Обновление токенов
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@GetCurrentTokenData() token: T_TokenData) {
    return this.tokenService.generateTokens(Number(token.sub), token.email)
  }

  // Верификация почты
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  emailConfirmation(@Body() dto: EmailConfirmDto) {
    return this.authService.emailConfirmation(dto)
  }
}
