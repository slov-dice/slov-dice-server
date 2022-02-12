import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy, RtStrategy } from './strategies';
import { LobbyModule } from 'modules/lobby/lobby.module';
import { UsersService } from 'modules/users/users.service';
import { MailModule } from 'modules/mail/mail.module';

@Module({
  imports: [JwtModule.register({}), LobbyModule, HttpModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy, UsersService],
  exports: [AuthService],
})
export class AuthModule {}
