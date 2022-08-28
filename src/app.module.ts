import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import { AuthModule } from 'modules/auth/auth.module'
import { PrismaModule } from 'modules/prisma/prisma.module'
import { TasksModule } from 'modules/tasks/tasks.module'
import { LobbyChatModule } from 'modules/lobbyChat/lobbyChat.module'
import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'
import { LobbyRoomsModule } from './modules/lobbyRooms/lobbyRooms.module'

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
    LobbyChatModule,
    LobbyUsersModule,
    LobbyRoomsModule,
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
