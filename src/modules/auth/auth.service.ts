import { ForbiddenException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import * as argon2 from 'argon2';

import { AuthDto } from './dto/auth.dto';
import { Tokens, SignInRes } from './types';
import { PrismaService } from 'modules/prisma/prisma.service';
import { LobbyService } from 'modules/lobby/lobby.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private lobby: LobbyService,
  ) {}

  async signUpLocal(dto: AuthDto): Promise<Tokens> {
    const hash = await this.hashData(dto.password);
    const newUser = await this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        hash,
      },
    });

    const tokens = await this.getTokens(newUser.id, newUser.nickname);
    await this.updateRtHash(newUser.id, tokens.refresh_token);
    return tokens;
  }

  async signInLocal(dto: AuthDto, response: Response): Promise<SignInRes> {
    const user = await this.prisma.user.findUnique({
      where: { nickname: dto.nickname },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await argon2.verify(user.hash, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.nickname);
    await this.updateRtHash(user.id, tokens.refresh_token);

    response.cookie('access_token', tokens.access_token, {
      httpOnly: false,
      // secure: !development,
      // domain: this.config.get<string>('CLIENT_SERVER'),
      // 30 * 24 * 60 * 60 * 1000
      maxAge: 15 * 60 * 1000,
    });
    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      // secure: !true,
      // domain: this.config.get<string>('CLIENT_SERVER'),
      // 30 * 24 * 60 * 60 * 1000
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      profile: { id: user.id, nickname: user.nickname },
      tokens,
    };
  }

  async logout(userId: number, response: Response, request: Request) {
    console.log(userId);
    // const { refresh_token } = request.cookies;
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    // TODO: Обновлять по refresh_token из куки, избавиться от userId. Нужно избавиться от хэширования токенов?
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
  }
  async refreshTokens(userId: number, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon2.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.nickname);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = await this.hashData(rt);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  hashData(data: string) {
    return argon2.hash(data);
  }

  async getTokens(userId: number, nickname: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          nickname,
        },
        {
          secret: this.config.get<string>('JWT_SECRET_AT'),
          expiresIn: 60 * 15, // 15 минут
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          nickname,
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
