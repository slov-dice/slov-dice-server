import {
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { map } from 'rxjs';
import * as argon2 from 'argon2';

import { SignUpDto, SignInDto } from './dto/auth.dto';
import { AuthRes, Tokens } from './types/response.type';
import { LobbyService } from 'modules/lobby/lobby.service';
import { UsersService } from 'modules/users/users.service';
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
    );

    const tokens = await this.generateTokens(user.id);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);

    await this.usersService.updateRt(user.id, tokens.refresh_token);

    // Добавляем юзера в лобби
    this.lobby.addRegisteredUser(user, dto.socketId);

    return { id: user.id, nickname: user.nickname, email: user.email };
  }

  async signInLocal(dto: SignInDto, response: Response): Promise<AuthRes> {
    const user = await this.usersService.findOneUniqueByNickname(dto.nickname);

    // Если пользователь не найден
    if (!user) throw new ForbiddenException('User not found');

    const passwordMatches = await argon2.verify(user.hash, dto.password);

    // Если пароли не совпадают
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user.id);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);

    await this.usersService.updateRt(user.id, tokens.refresh_token);

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
  }

  async logout(userId: number, response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    this.usersService.removeRt(userId);
  }

  // TODO: return type Observable<AxiosResponse<any>>
  authDiscordRedirect(code: string) {
    console.log(code);
    return this.httpService
      .post(
        'https://discord.com/api/v8/oauth2/token',
        JSON.stringify({
          client_id: this.config.get<string>('DISCORD_CLIENT_ID'),
          client_secret: this.config.get<string>('DISCORD_CLIENT_SECRET'),
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:3000/auth/discord',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .pipe(map((response) => console.log('data', response.data)));
  }

  async refreshTokens(refresh_token: string, res: Response) {
    try {
      // RT не найден в куки
      if (!refresh_token) {
        throw new UnauthorizedException('Unauthorized!');
      }

      const userData = this.jwtService.verify(refresh_token, {
        secret: this.config.get<string>('JWT_SECRET_RT'),
      });

      const userDB = await this.usersService.findOneByRefreshToken(
        refresh_token,
      );

      // RT пользователя не найдено в бд
      if (!userData || !userDB) {
        throw new UnauthorizedException('Unauthorized!');
      }

      const user = await this.usersService.findOneUniqueById(userData.sub);
      const tokens = await this.generateTokens(user.id);

      // Update the refresh token
      await this.usersService.updateRefreshTokenById(
        userData.sub,
        refresh_token,
      );

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
}
