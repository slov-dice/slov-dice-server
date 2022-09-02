import {
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { lastValueFrom } from 'rxjs'
import { Response } from 'express'
import * as argon2 from 'argon2'
import { AxiosResponse } from 'axios'

import {
  SignUpDto,
  SignInDto,
  ThirdPartyDto,
  EmailConfirmDto,
  LogoutDto,
} from './dto/auth.dto'
import {
  T_AuthResponse,
  T_ThirdPartyUserData,
  T_Tokens,
} from './models/response.type'
import { TokenParams } from './models/params.type'
import { TokenData } from './models/tokens.type'
import { UsersService } from 'modules/users/users.service'
import { MailService } from 'modules/mail/mail.service'
import { LobbyUsersService } from 'modules/lobbyUsers/lobbyUsers.service'
import { E_AuthType, T_AccessToken, T_RefreshToken } from 'models/app'
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
  ) {}

  // Регистрация
  async signUpLocal(
    dto: SignUpDto,
    response: Response,
  ): Promise<T_AuthResponse> {
    const userExists = await this.usersService.findOneByEmailAndNickname(
      dto.email,
      dto.nickname,
    )

    // Если пользователь найден
    if (userExists) throw new ForbiddenException(t('auth.error.userExist'))

    const hashedPassword = await argon2.hash(dto.password)
    const user = await this.usersService.create(
      dto.email,
      dto.nickname,
      hashedPassword,
      E_AuthType.email,
    )

    const tokens = await this.generateTokens(user.id, user.email)
    this.setCookies(tokens.access_token, tokens.refresh_token, response)

    // Добавление сокета
    this.lobbyUsers.create(user)

    // Email верификация
    const verifyToken = await this.generateMailToken(user.id, user.email)
    await this.mailService.sendUserConfirmation(user, verifyToken)

    return {
      accessToken: tokens.access_token,
      message: t('auth.success.registered'),
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  // Аутентификация
  async signInLocal(
    dto: SignInDto,
    response: Response,
  ): Promise<T_AuthResponse> {
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

    const tokens = await this.generateTokens(user.id, user.email)
    this.setCookies(tokens.access_token, tokens.refresh_token, response)

    return {
      accessToken: tokens.access_token,
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
    const params: TokenParams = {
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
    response: Response,
  ): Promise<T_AuthResponse> {
    const user = await this.usersService.findUnique('email', data.email)

    // Аутентификация
    if (user) {
      if (user.from !== authType)
        throw new ForbiddenException(t('auth.error.mailRegistered'))

      const tokens = await this.generateTokens(user.id, user.email)
      this.setCookies(tokens.access_token, tokens.refresh_token, response)
      return {
        accessToken: tokens.access_token,
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

      const tokens = await this.generateTokens(user.id, user.email)
      this.setCookies(tokens.access_token, tokens.refresh_token, response)
      this.lobbyUsers.create(user)

      return {
        accessToken: tokens.access_token,
        message: t('auth.success.registered'),
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      }
    }
  }

  async guestAuth(response: Response) {
    const postfix = ~~(Math.random() * (9999 - 1000) + 1000)
    const nickname = `Player-${postfix}`

    const user = await this.usersService.create(
      null,
      nickname,
      '',
      E_AuthType.guest,
    )

    const tokens = await this.generateTokens(user.id, user.email)
    this.setCookies(tokens.access_token, tokens.refresh_token, response)
    this.lobbyUsers.create(user)

    return {
      accessToken: tokens.access_token,
      message: t('auth.success.registered'),
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  async check(ac: T_AccessToken, rt: T_RefreshToken) {
    const tokenData: TokenData = this.jwtService.verify(rt, {
      secret: this.config.get('JWT_SECRET_RT'),
    })

    const user = await this.usersService.findUnique('id', tokenData.sub)

    return {
      accessToken: ac,
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  logout(userId: number, response: Response, dto: LogoutDto) {
    if (dto.from === E_AuthType.guest) {
      this.usersService.removeById(userId)
    }
    response.clearCookie('access_token')
    response.clearCookie('refresh_token')
  }

  async refreshTokens(rt: T_RefreshToken, response: Response) {
    try {
      // RT не найден в куки
      if (!rt) {
        throw new UnauthorizedException(t('auth.error.unauthorized'))
      }

      const tokenData: TokenData = this.jwtService.verify(rt, {
        secret: this.config.get('JWT_SECRET_RT'),
      })

      if (!tokenData) {
        throw new UnauthorizedException(t('auth.error.unauthorized'))
      }

      const user = await this.usersService.findUnique('id', tokenData.sub)
      const tokens = await this.generateTokens(user.id, user.email)

      this.setCookies(tokens.access_token, tokens.refresh_token, response)
      return tokens
    } catch {
      throw new NotFoundException(t('auth.error.refreshTokenExpired'))
    }
  }

  async emailConfirmation(dto: EmailConfirmDto) {
    let tokenData: TokenData
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

  setCookies(at: string, rt: string, response: Response) {
    response.cookie('access_token', at, {
      httpOnly: false,
      maxAge: 60_000 * 15, // 15 минут
      sameSite: 'none',
      secure: true,
    })
    response.cookie('refresh_token', rt, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // неделя
      sameSite: 'none',
      secure: true,
    })
  }

  async generateTokens(userId: number, email: string): Promise<T_Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.config.get('JWT_SECRET_AT'),
          expiresIn: 15 * 60, // 15 минут
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.config.get('JWT_SECRET_RT'),
          expiresIn: 60 * 60 * 24 * 7, // неделя
        },
      ),
    ])

    return {
      access_token: at,
      refresh_token: rt,
    }
  }

  async generateMailToken(userId: number, email: string): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.config.get('JWT_SECRET_MAIL'),
        expiresIn: 60 * 60, // 1 час
      },
    )
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
