import { User } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from 'modules/prisma/prisma.service'
import { E_AuthType } from 'models/app'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    email: string | null,
    nickname: string,
    hash: string,
    from: E_AuthType,
  ): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email,
        nickname,
        from,
        hash,
        verified: false,
      },
    })
  }

  async getAll(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async getTotalUsersCount(): Promise<number> {
    return await this.prisma.user.count()
  }

  async findOneByEmailAndNickname(
    email: string,
    nickname: string,
  ): Promise<User> {
    return await this.prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] },
    })
  }

  async findUnique(
    name: 'id' | 'email' | 'nickname',
    param: number | string,
  ): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { [name]: param },
    })
  }

  async verifyEmail(email: string): Promise<User> {
    return await this.prisma.user.update({
      where: { email },
      data: { verified: true },
    })
  }

  async updatePassword(email: string, hash: string): Promise<User> {
    return await this.prisma.user.update({
      where: { email },
      data: { hash },
    })
  }

  async removeById(id: number) {
    await this.prisma.user.delete({
      where: {
        id,
      },
    })
  }

  // Удаление старых пользователей типа "Гость",
  // если от даты создания прошла неделя
  async removeOldGuests() {
    return await this.prisma.user.deleteMany({
      where: {
        AND: [
          {
            from: E_AuthType.guest,
            created_at: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
          },
        ],
      },
    })
  }

  generateNicknameByEmail(email: string): string {
    return email.split('@')[0]
  }
}
