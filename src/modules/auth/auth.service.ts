import {
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import * as argon2 from 'argon2';

import { SignUpDto, SignInDto } from './dto/auth.dto';
import { AuthRes, Tokens } from './types/response.type';
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

  async signUpLocal(dto: SignUpDto, response: Response): Promise<AuthRes> {
    const userExists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { nickname: dto.nickname }] },
    });
    if (userExists) throw new ForbiddenException('User already exists!');

    const hashedPassword = await this.hashData(dto.password);
    const user = await this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        email: dto.email,
        hash: hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);

    await this.updateRt(user.id, tokens.refresh_token);

    // Добавляем юзера в лобби
    this.lobby.setRegisteredUser(user, dto.socketId);

    return { id: user.id, nickname: user.nickname, email: user.email };
  }

  async signInLocal(dto: SignInDto, response: Response): Promise<AuthRes> {
    const user = await this.prisma.user.findUnique({
      where: { nickname: dto.nickname },
    });

    // Если пользователь не найден
    if (!user) throw new ForbiddenException('User not found');

    const passwordMatches = await argon2.verify(user.hash, dto.password);

    // Если пароли не совпадают
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user.id);
    this.setCookies(tokens.access_token, tokens.refresh_token, response);

    await this.updateRt(user.id, tokens.refresh_token);

    // Добавляем юзера в лобби
    this.lobby.setUserOnline(user.id, dto.socketId);

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
  }

  async logout(userId: number, response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refresh_token: {
          not: null,
        },
      },
      data: {
        refresh_token: null,
      },
    });
  }
  async refreshTokens(req: Request, res: Response) {
    try {
      const { refresh_token } = req.cookies;
      if (!refresh_token) {
        console.log('нету рефреша в куки');
        throw new UnauthorizedException('Unauthorized!');
      }
      const userData = this.jwtService.verify(refresh_token, {
        secret: this.config.get<string>('JWT_SECRET_RT'),
      });
      const tokenFromDb = await this.prisma.user.findFirst({
        where: {
          refresh_token: refresh_token,
        },
      });
      if (!userData || !tokenFromDb) {
        console.log('!userData || !tokenFromDb');
        throw new UnauthorizedException('Unauthorized!');
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id: userData.sub,
        },
      });
      const tokens = await this.generateTokens(user.id);

      // Update the refresh token
      await this.prisma.user.update({
        where: {
          id: userData.sub,
        },
        data: {
          refresh_token: tokens.refresh_token,
        },
      });
      this.setCookies(tokens.access_token, tokens.refresh_token, res);
      return tokens;
    } catch {
      throw new NotFoundException('Refresh token expired');
    }
  }

  async updateRt(userId: number, rt: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refresh_token: rt,
      },
    });
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
