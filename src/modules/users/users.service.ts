import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'modules/prisma/prisma.service';
import { AuthType } from 'modules/auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    email: string | null,
    nickname: string,
    hash: string,
    from: AuthType,
  ): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email,
        nickname,
        from,
        hash,
      },
    });
  }

  async getAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getTotalUsersCount(): Promise<number> {
    return await this.prisma.user.count();
  }

  async findOneByEmailAndNickname(
    email: string,
    nickname: string,
  ): Promise<User> {
    return await this.prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] },
    });
  }

  async findUnique(
    name: 'id' | 'email' | 'nickname',
    param: number | string,
  ): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { [name]: param },
    });
  }

  // async findOneByRefreshToken(refresh_token: string): Promise<User> {
  //   return await this.prisma.user.findFirst({
  //     where: { refresh_token },
  //   });
  // }

  // async updateRefreshTokenById(
  //   id: number,
  //   refresh_token: string,
  // ): Promise<User> {
  //   return await this.prisma.user.update({
  //     where: { id },
  //     data: { refresh_token },
  //   });
  // }

  // async updateRt(id: number, refresh_token: string) {
  //   await this.prisma.user.update({
  //     where: { id },
  //     data: { refresh_token },
  //   });
  // }

  // async removeRt(id: number) {
  //   await this.prisma.user.updateMany({
  //     where: {
  //       id,
  //       refresh_token: {
  //         not: null,
  //       },
  //     },
  //     data: {
  //       refresh_token: null,
  //     },
  //   });
  // }

  generateNicknameByEmail(email: string): string {
    return email.split('@')[0];
  }
}
