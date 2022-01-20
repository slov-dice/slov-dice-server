import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'modules/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, nickname: string, hash: string): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email,
        nickname,
        hash,
      },
    });
  }

  async getAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOneByEmailAndNickname(
    email: string,
    nickname: string,
  ): Promise<User> {
    return await this.prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] },
    });
  }

  async findOneUniqueById(id: number): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneUniqueByNickname(nickname: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { nickname },
    });
  }

  async findOneByRefreshToken(refresh_token: string): Promise<User> {
    return await this.prisma.user.findFirst({
      where: { refresh_token },
    });
  }

  async updateRefreshTokenById(
    id: number,
    refresh_token: string,
  ): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: { refresh_token },
    });
  }

  async updateRt(id: number, refresh_token: string) {
    await this.prisma.user.update({
      where: { id },
      data: { refresh_token },
    });
  }

  async removeRt(id: number) {
    await this.prisma.user.updateMany({
      where: {
        id,
        refresh_token: {
          not: null,
        },
      },
      data: {
        refresh_token: null,
      },
    });
  }
}
