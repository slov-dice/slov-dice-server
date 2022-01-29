import {
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import * as argon2 from 'argon2';

import { SignUpDto, SignInDto, ThirdPartyDto, AuthType } from './dto/auth.dto';
import { AuthRes, ThirdPartyUserData, Tokens } from './types/response.type';
import { TokenParams } from './types/params.type';
import { LobbyService } from 'modules/lobby/lobby.service';
import { UsersService } from 'modules/users/users.service';
import { AxiosResponse } from 'axios';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private lobby: LobbyService,
    private httpService: HttpService,
    private usersService: UsersService,
  ) {}

  async signUpLocal(dto: SignUpDto, response: Response): Promise<AuthRes> {
    const userExists = await this.usersService.findOneByEmailAndNickname(
      dto.email,
      dto.nickname,
    );

    if (userExists) throw new ForbiddenException('User already exists!');

    const hashedPassword = await this.hashData(dto.password);
    const user = await this.usersService.create(
      dto.email,
      dto.nickname,
      hashedPassword,
      AuthType.email,
    );

    const tokens = await this.generateTokens(user.id);
    // await this.usersService.updateRt(user.id, tokens.refresh_token);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);

    this.lobby.addRegisteredUser(user, dto.socketId);

    return { id: user.id, nickname: user.nickname, email: user.email };
  }

  async signInLocal(dto: SignInDto, response: Response): Promise<AuthRes> {
    const user = await this.usersService.findUnique('email', dto.email);

    // Если пользователь не найден
    if (!user) throw new ForbiddenException('User not found');

    const passwordMatches = await argon2.verify(user.hash, dto.password);

    // Если пароли не совпадают
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user.id);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);

    // await this.usersService.updateRt(user.id, tokens.refresh_token);

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
  }

  async getTokenFromThirdParty(
    dto: ThirdPartyDto,
  ): Promise<AxiosResponse<any, any>> {
    const url = this.getTokenUrlThirdParty(dto.authType);
    const params: TokenParams = {
      client_id: this.config.get(`${dto.authType}_CLIENT_ID`),
      client_secret: this.config.get(`${dto.authType}_CLIENT_SECRET`),
      redirect_uri: this.config.get('AUTH_REDIRECT_URL'),
      code: dto.code,
      grant_type: 'authorization_code',
    };
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    return await lastValueFrom(
      this.httpService.post(url, new URLSearchParams(params), config),
    );
  }

  async getDataFromThirdParty(
    authType: AuthType,
    access_token: string,
  ): Promise<AxiosResponse<any, any>> {
    const url = this.getDataUrlThirdParty(authType);
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    return await lastValueFrom(this.httpService.get(url, config));
  }

  async authByThirdParty(
    authType: AuthType,
    data: ThirdPartyUserData,
    socketId: string,
    response: Response,
  ): Promise<AuthRes> {
    const user = await this.usersService.findUnique('email', data.email);

    // TODO: ПРОВЕРКА НА authType

    // Аутентификация
    if (user) {
      const tokens = await this.generateTokens(user.id);
      this.setCookies(tokens.access_token, tokens.refresh_token, response);
      // await this.usersService.updateRt(user.id, tokens.refresh_token);
      return {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      };
    }

    // Регистрация
    else if (!user) {
      const nickname = this.usersService.generateNicknameByEmail(data.email);
      const createdUser = await this.usersService.create(
        data.email,
        nickname,
        '',
        authType,
      );

      const tokens = await this.generateTokens(createdUser.id);
      // await this.usersService.updateRt(createdUser.id, tokens.refresh_token);
      this.setCookies(tokens.access_token, tokens.refresh_token, response);
      this.lobby.addRegisteredUser(createdUser, socketId);

      return {
        id: createdUser.id,
        nickname: createdUser.nickname,
        email: createdUser.email,
      };
    }
  }

  async guestAuth(socketId: string, response: Response) {
    const totalCount = await this.usersService.getTotalUsersCount();
    const nickname = `Player-${totalCount}`;

    const createdUser = await this.usersService.create(
      null,
      nickname,
      '',
      AuthType.guest,
    );

    const tokens = await this.generateTokens(createdUser.id);
    // await this.usersService.updateRt(createdUser.id, tokens.refresh_token);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);
    this.lobby.addRegisteredUser(createdUser, socketId);

    return {
      id: createdUser.id,
      nickname: createdUser.nickname,
      email: createdUser.email,
    };
  }

  async logout(userId: number, response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    // this.usersService.removeRt(userId);
  }

  async refreshTokens(refresh_token: string, res: Response) {
    try {
      // RT не найден в куки
      if (!refresh_token) {
        throw new UnauthorizedException('Unauthorized!');
      }

      const userData = this.jwtService.verify(refresh_token, {
        secret: this.config.get('JWT_SECRET_RT'),
      });

      // const userDB = await this.usersService.findOneByRefreshToken(
      //   refresh_token,
      // );

      // RT пользователя не найдено в бд
      // if (!userData || !userDB) {
      if (!userData) {
        throw new UnauthorizedException('Unauthorized!');
      }

      const user = await this.usersService.findUnique('id', userData.sub);
      const tokens = await this.generateTokens(user.id);

      // Обновление rt
      // await this.usersService.updateRefreshTokenById(
      //   userData.sub,
      //   refresh_token,
      // );

      this.setCookies(tokens.access_token, tokens.refresh_token, res);
      return tokens;
    } catch {
      throw new NotFoundException('Refresh token expired');
    }
  }

  hashData(data: string) {
    return argon2.hash(data);
  }

  setCookies(at: string, rt: string, response: Response) {
    response.cookie('access_token', at, {
      httpOnly: false,
      maxAge: 60_000 * 15, // 15 минут
    });
    response.cookie('refresh_token', rt, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // неделя
    });
  }

  async generateTokens(userId: number): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret: this.config.get<string>('JWT_SECRET_AT'),
          expiresIn: 15 * 60, // 15 минут
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret: this.config.get<string>('JWT_SECRET_RT'),
          expiresIn: 60 * 60 * 24 * 7, // неделя
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  getTokenUrlThirdParty(authType: AuthType): string {
    switch (authType) {
      case AuthType.discord:
        return 'https://discord.com/api/oauth2/token';
      case AuthType.google:
        return 'https://oauth2.googleapis.com/token';
    }
  }

  getDataUrlThirdParty(authType: AuthType): string {
    switch (authType) {
      case AuthType.discord:
        return 'https://discord.com/api/v6/users/@me';
      case AuthType.google:
        return 'https://www.googleapis.com/oauth2/v2/userinfo';
    }
  }
}
