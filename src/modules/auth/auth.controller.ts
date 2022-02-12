import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'express'

import { AuthService } from './auth.service'
import {
  SignUpDto,
  SignInDto,
  ThirdPartyDto,
  RestoreDto,
  EmailConfirmDto,
  ChangePasswordDto,
} from './dto/auth.dto'
import { AuthRes, ThirdPartyUserData } from './types/response.type'
import { GetCurrentUserId } from 'decorators'
import { GetReqRT } from 'decorators/get-req-rt.decorator'
import { AtGuard } from 'guards'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Регистрация через почту
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signUpLocal(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    return this.authService.signUpLocal(dto, response)
  }

  // Аутентификация через почту
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  signInLocal(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    return this.authService.signInLocal(dto, response)
  }

  // Сторонняя авторизация
  @Post('token')
  async tokenAuth(
    @Body() dto: ThirdPartyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthRes> {
    try {
      // Получаем токен пользователя с помощью кода
      const responseToken = await this.authService.getTokenFromThirdParty(dto)

      // Получаем юзера
      const responseUser = await this.authService.getDataFromThirdParty(
        dto.authType,
        responseToken.data.access_token,
      )

      const userData: ThirdPartyUserData = responseUser.data

      // Регистрируем или аутентифицируем юзера
      return this.authService.authByThirdParty(dto.authType, userData, response)
    } catch (error) {
      throw new ForbiddenException('Unauthorized!')
    }
  }

  @Post('guest')
  guestAuth(@Res({ passthrough: true }) response: Response): Promise<AuthRes> {
    return this.authService.guestAuth(response)
  }

  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetCurrentUserId() userId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(userId, response)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetReqRT() rt: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshTokens(rt, response)
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  emailConfirmation(@Body() dto: EmailConfirmDto) {
    return this.authService.emailConfirmation(dto)
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  restorePassword(@Body() dto: RestoreDto) {
    return this.authService.restore(dto)
  }

  @Post('change/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto)
  }
}
