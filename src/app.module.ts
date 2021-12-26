import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { AuthModule } from 'modules/auth/auth.module';
import { PrismaModule } from 'modules/prisma/prisma.module';
import { LobbyGateway } from 'modules/lobby/lobby.gateway';
import { AtGuard } from 'guards';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PrismaModule],
  controllers: [],
  providers: [
    LobbyGateway,
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule {}
