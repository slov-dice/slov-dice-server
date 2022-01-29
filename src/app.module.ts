import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { AuthModule } from 'modules/auth/auth.module';
import { PrismaModule } from 'modules/prisma/prisma.module';
import { LobbyModule } from 'modules/lobby/lobby.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    LobbyModule,
  ],
  controllers: [],
})
export class AppModule {}
