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
import {
  SignUpDto,
  SignInDto,
  ThirdPartyDto,
  EmailConfirmDto,
  LogoutDto,
} from './dto/auth.dto'
import { T_AuthResponse, T_ThirdPartyUserData } from './models/response.type'

import { GetCurrentUserId, GetReqRT } from 'decorators'
import { AtGuard } from 'guards'
import { GetReqAT } from 'decorators/getReqAT.decorator'
import { T_AccessToken, T_RefreshToken } from 'models/app'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Регистрация через почту
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signUpLocal(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<T_AuthResponse> {
    return this.authService.signUpLocal(dto, response)
  }

  // Аутентификация через почту
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  signInLocal(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<T_AuthResponse> {
    return this.authService.signInLocal(dto, response)
  }

  // Первоначальная проверка авторизации
  @UseGuards(AtGuard)
  @Post('check')
  @HttpCode(HttpStatus.OK)
  checkAuth(
    @GetReqAT() at: T_AccessToken,
    @GetReqRT() rt: T_RefreshToken,
  ): Promise<T_AuthResponse> {
    return this.authService.check(at, rt)
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
  async tokenAuth(
    @Body() dto: ThirdPartyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<T_AuthResponse> {
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
      return this.authService.authByThirdParty(dto.authType, userData, response)
    } catch (error) {
      throw new ForbiddenException('Unauthorized!')
    }
  }

  // Авторизация гостем
  @Get('guest')
  @HttpCode(HttpStatus.OK)
  guestAuth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<T_AuthResponse> {
    return this.authService.guestAuth(response)
  }

  // Выход из системы, удаляем все токены пользователя
  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Body() dto: LogoutDto,
    @GetCurrentUserId() userId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(userId, response, dto)
  }

  // Обновление токенов
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetReqRT() rt: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshTokens(rt, response)
  }

  // Верификация почты
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  emailConfirmation(@Body() dto: EmailConfirmDto) {
    return this.authService.emailConfirmation(dto)
  }
}
