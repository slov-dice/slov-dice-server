import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import { AuthModule } from 'modules/auth/auth.module'
import { PrismaModule } from 'modules/prisma/prisma.module'
import { LobbyModule } from 'modules/lobby/lobby.module'
import { TasksModule } from 'modules/tasks/tasks.module'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20,
    }),
    ScheduleModule.forRoot(),
    TasksModule,
    AuthModule,
    PrismaModule,
    LobbyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [],
})
export class AppModule {}
