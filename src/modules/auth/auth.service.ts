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
  RestoreDto,
  ChangePasswordDto,
} from './dto/auth.dto'
import { AuthRes, ThirdPartyUserData, Tokens } from './types/response.type'
import { TokenParams } from './types/params.type'
import { LobbyService } from 'modules/lobby/lobby.service'
import { UsersService } from 'modules/users/users.service'
import { MailService } from 'modules/mail/mail.service'
import { AuthTypeEnum } from 'interfaces/app'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private lobby: LobbyService,
    private httpService: HttpService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  async signUpLocal(dto: SignUpDto, response: Response): Promise<AuthRes> {
    const userExists = await this.usersService.findOneByEmailAndNickname(
      dto.email,
      dto.nickname,
    )

    if (userExists) throw new ForbiddenException('User already exists!')

    const hashedPassword = await this.hashData(dto.password)
    const user = await this.usersService.create(
      dto.email,
      dto.nickname,
      hashedPassword,
      AuthTypeEnum.email,
    )

    const tokens = await this.generateTokens(user.id, user.email)
    this.setCookies(tokens.access_token, tokens.refresh_token, response)

    // Добавление сокета
    this.lobby.createRegisteredUser(user)

    // Email верификация
    const verifyToken = await this.generateMailToken(user.id, user.email)
    await this.mailService.sendUserConfirmation(user, verifyToken)

    return { id: user.id, nickname: user.nickname, email: user.email }
  }

  async signInLocal(dto: SignInDto, response: Response): Promise<AuthRes> {
    const user = await this.usersService.findUnique('email', dto.email)

    // Если пользователь не найден
    if (!user) throw new ForbiddenException('User not found')

    const passwordMatches = await argon2.verify(user.hash, dto.password)

    // Если пароли не совпадают
    if (!passwordMatches) throw new ForbiddenException('Access Denied')

    const tokens = await this.generateTokens(user.id, user.email)
    this.setCookies(tokens.access_token, tokens.refresh_token, response)

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

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

  async getDataFromThirdParty(
    authType: AuthTypeEnum,
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

  async authByThirdParty(
    authType: AuthTypeEnum,
    data: ThirdPartyUserData,
    response: Response,
  ): Promise<AuthRes> {
    const user = await this.usersService.findUnique('email', data.email)

    if (user.from !== authType)
      throw new ForbiddenException('This email already exist')

    // Аутентификация
    if (user) {
      const tokens = await this.generateTokens(user.id, user.email)
      this.setCookies(tokens.access_token, tokens.refresh_token, response)
      return {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      }
    }

    // Регистрация
    else if (!user) {
      const nickname = this.usersService.generateNicknameByEmail(data.email)
      const createdUser = await this.usersService.create(
        data.email,
        nickname,
        '',
        authType,
      )

      const tokens = await this.generateTokens(
        createdUser.id,
        createdUser.email,
      )
      this.setCookies(tokens.access_token, tokens.refresh_token, response)
      this.lobby.createRegisteredUser(createdUser)

      return {
        id: createdUser.id,
        nickname: createdUser.nickname,
        email: createdUser.email,
      }
    }
  }

  async guestAuth(response: Response) {
    const totalCount = await this.usersService.getTotalUsersCount()
    const nickname = `Player-${totalCount}`

    const user = await this.usersService.create(
      null,
      nickname,
      '',
      AuthTypeEnum.guest,
    )

    const tokens = await this.generateTokens(user.id, user.email)
    this.setCookies(tokens.access_token, tokens.refresh_token, response)
    this.lobby.createRegisteredUser(user)

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    }
  }

  async logout(userId: number, response: Response) {
    response.clearCookie('access_token')
    response.clearCookie('refresh_token')
  }

  async refreshTokens(refresh_token: string, res: Response) {
    try {
      // RT не найден в куки
      if (!refresh_token) {
        throw new UnauthorizedException('Unauthorized!')
      }

      // TODO: типизировать данные токена
      const userData = this.jwtService.verify(refresh_token, {
        secret: this.config.get('JWT_SECRET_RT'),
      })

      if (!userData) {
        throw new UnauthorizedException('Unauthorized!')
      }

      const user = await this.usersService.findUnique('id', userData.sub)
      const tokens = await this.generateTokens(user.id, user.email)

      this.setCookies(tokens.access_token, tokens.refresh_token, res)
      return tokens
    } catch {
      throw new NotFoundException('Refresh token expired')
    }
  }

  async emailConfirmation(dto: EmailConfirmDto) {
    const tokenData = this.jwtService.verify(dto.token, {
      secret: this.config.get('JWT_SECRET_MAIL'),
    })

    const user = await this.usersService.verifyEmail(tokenData.email)

    if (!user) throw new NotFoundException('User does not exist')
    if (!user.verified) throw new NotFoundException('Failed to verify email')
  }

  async restore(dto: RestoreDto) {
    const user = await this.usersService.findUnique('email', dto.email)

    if (!user) throw new ForbiddenException('User does not exist')

    const restoreToken = await this.generateRestoreToken(user.id, user.email)
    this.mailService.sendUserRestorePassword(user, restoreToken)
  }

  async changePassword(dto: ChangePasswordDto) {
    const tokenData = this.jwtService.verify(dto.token, {
      secret: this.config.get('JWT_SECRET_RESTORE'),
    })

    if (!tokenData) throw new ForbiddenException('Token is not valid!')

    const user = await this.usersService.findUnique('email', tokenData.email)

    if (!user) throw new ForbiddenException('User does not exist')
    if (!user.verified) throw new ForbiddenException('Email is not verified!')

    const passwordMatches = await argon2.verify(user.hash, dto.password)

    // Если пароли совпадают
    if (passwordMatches)
      throw new ForbiddenException('The password must not match the old value')

    const hashedPassword = await this.hashData(dto.password)

    await this.usersService.updatePassword(user.email, hashedPassword)
  }

  hashData(data: string) {
    return argon2.hash(data)
  }

  setCookies(at: string, rt: string, response: Response) {
    response.cookie('access_token', at, {
      httpOnly: false,
      maxAge: 60_000 * 15, // 15 минут
    })
    response.cookie('refresh_token', rt, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // неделя
    })
  }

  async generateTokens(userId: number, email: string): Promise<Tokens> {
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

  async generateRestoreToken(userId: number, email: string): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.config.get('JWT_SECRET_RESTORE'),
        expiresIn: 60 * 60, // 1 час
      },
    )
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

  getTokenUrlThirdParty(authType: AuthTypeEnum): string {
    switch (authType) {
      case AuthTypeEnum.discord:
        return 'https://discord.com/api/oauth2/token'
      case AuthTypeEnum.google:
        return 'https://oauth2.googleapis.com/token'
    }
  }

  getDataUrlThirdParty(authType: AuthTypeEnum): string {
    switch (authType) {
      case AuthTypeEnum.discord:
        return 'https://discord.com/api/v6/users/@me'
      case AuthTypeEnum.google:
        return 'https://www.googleapis.com/oauth2/v2/userinfo'
    }
  }
}
