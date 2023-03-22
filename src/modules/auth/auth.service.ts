import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { lastValueFrom } from 'rxjs'
import * as argon2 from 'argon2'
import { AxiosResponse } from 'axios'

import { SignUpDto, SignInDto, ThirdPartyDto, EmailConfirmDto } from './dtos'
import { T_AuthResponse, T_ThirdPartyUserData } from './models/response.model'
import { T_TokenParams } from './models/params.model'
import { TokenService } from './token.service'

import { UsersService } from 'modules/users/users.service'
import { MailService } from 'modules/mail/mail.service'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import { E_AuthType, T_TokenData, T_UserId } from 'models/shared/app'
import { t } from 'languages'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private lobbyUsers: LobbyUsersService,
    private httpService: HttpService,
    private usersService: UsersService,
    private mailService: MailService,
    private tokenService: TokenService,
  ) {}

  // Регистрация
  async signUpLocal(dto: SignUpDto): Promise<T_AuthResponse> {
    const userExists = await this.usersService.findOneByEmailAndNickname(
      dto.email,
      dto.nickname,
    )

    // Если пользователь найден
    // 401
    if (userExists) throw new ForbiddenException(t('auth.error.userExist'))

    const hashedPassword = await argon2.hash(dto.password)
    const user = await this.usersService.create(
      dto.email,
      dto.nickname,
      hashedPassword,
      E_AuthType.email,
    )

    const tokens = await this.tokenService.generateTokens(user.id, user.email)

    // Добавление сокета
    this.lobbyUsers.create(user)

    // Email верификация
    const verifyToken = await this.tokenService.generateMailToken(
      user.id,
      user.email,
    )
    // Отправка письма подтверждения
    await this.mailService.sendUserConfirmation(user, verifyToken, dto.language)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: t('auth.success.registered'),
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  // Аутентификация
  async signInLocal(dto: SignInDto): Promise<T_AuthResponse> {
    const user = await this.usersService.findUnique('email', dto.email)

    // Если пользователь не найден
    if (!user) throw new ForbiddenException(t('auth.error.userNotFound'))

    // Если пользователь зарегистрирован через сторонний сервис
    if (user.from !== E_AuthType.email)
      throw new ForbiddenException(t('auth.error.userRegisteredByThirdParty'))

    const passwordMatches = await argon2.verify(user.hash, dto.password)

    // Если пароли не совпадают
    if (!passwordMatches)
      throw new ForbiddenException(t('auth.error.wrongPassword'))

    const tokens = await this.tokenService.generateTokens(user.id, user.email)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: t('auth.success.login'),
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  // Сторонняя авторизация, получение токена
  async getTokenFromThirdParty(
    dto: ThirdPartyDto,
  ): Promise<AxiosResponse<any, any>> {
    const url = this.getTokenUrlThirdParty(dto.authType)
    const params: T_TokenParams = {
      client_id: this.config.get(`${dto.authType}_CLIENT_ID`),
      client_secret: this.config.get(`${dto.authType}_CLIENT_SECRET`),
      redirect_uri: this.config.get('AUTH_REDIRECT_URL'),
      code: dto.code,
      grant_type: 'authorization_code',
    }
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }

    return await lastValueFrom(
      this.httpService.post(url, new URLSearchParams(params), config),
    )
  }

  // Сторонняя авторизация, получение пользователя
  async getDataFromThirdParty(
    authType: E_AuthType,
    access_token: string,
  ): Promise<AxiosResponse<any, any>> {
    const url = this.getDataUrlThirdParty(authType)
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }

    return await lastValueFrom(this.httpService.get(url, config))
  }

  // Сторонняя авторизация, авторизация пользователя
  async authByThirdParty(
    authType: E_AuthType,
    data: T_ThirdPartyUserData,
  ): Promise<T_AuthResponse> {
    const user = await this.usersService.findUnique('email', data.email)

    // Аутентификация
    if (user) {
      if (user.from !== authType)
        throw new ForbiddenException(t('auth.error.mailRegistered'))

      const tokens = await this.tokenService.generateTokens(user.id, user.email)
      console.log('---tokens---', tokens)
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: t('auth.success.login'),
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      }
    }

    // Регистрация
    else if (!user) {
      const nickname = this.usersService.generateNicknameByEmail(data.email)
      const user = await this.usersService.create(
        data.email,
        nickname,
        '',
        authType,
      )

      const tokens = await this.tokenService.generateTokens(user.id, user.email)
      this.lobbyUsers.create(user)

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: t('auth.success.registered'),
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      }
    }
  }

  async guestAuth() {
    const postfix = ~~(Math.random() * (9999 - 1000) + 1000)
    const nickname = `Player-${postfix}`

    const user = await this.usersService.create(
      null,
      nickname,
      '',
      E_AuthType.guest,
    )

    const tokens = await this.tokenService.generateTokens(user.id, user.email)
    this.lobbyUsers.create(user)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: t('auth.success.registered'),
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  async check(userId: T_UserId) {
    const user = await this.usersService.findUnique('id', userId)

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  async emailConfirmation(dto: EmailConfirmDto) {
    let tokenData: T_TokenData
    try {
      tokenData = this.jwtService.verify(dto.token, {
        secret: this.config.get('JWT_SECRET_MAIL'),
      })
    } catch (error) {
      throw new ForbiddenException('Token is not valid!')
    }

    const user = await this.usersService.verifyEmail(tokenData.email)

    if (!user) throw new NotFoundException(t('auth.error.userNotFound'))
    return { message: t('auth.success.verified') }
  }

  getTokenUrlThirdParty(authType: E_AuthType): string {
    switch (authType) {
      case E_AuthType.discord:
        return 'https://discord.com/api/oauth2/token'
      case E_AuthType.google:
        return 'https://oauth2.googleapis.com/token'
    }
  }

  getDataUrlThirdParty(authType: E_AuthType): string {
    switch (authType) {
      case E_AuthType.discord:
        return 'https://discord.com/api/v6/users/@me'
      case E_AuthType.google:
        return 'https://www.googleapis.com/oauth2/v2/userinfo'
    }
  }
}
