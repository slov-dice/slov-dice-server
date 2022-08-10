import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { HttpModule } from '@nestjs/axios'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthGateway } from './auth.gateway'
import { AtStrategy, RtStrategy } from './strategies'

import { LobbyUsersModule } from 'modules/lobbyUsers/lobbyUsers.module'
import { UsersService } from 'modules/users/users.service'
import { MailModule } from 'modules/mail/mail.module'

@Module({
  imports: [JwtModule.register({}), LobbyUsersModule, HttpModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy, UsersService, AuthGateway],
  exports: [AuthService],
})
export class AuthModule {}
