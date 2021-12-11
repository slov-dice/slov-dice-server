import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { LobbyGateway } from './modules/lobby/lobby.gateway';
import { LobbyModule } from './modules/lobby/lobby.module';

@Module({
  imports: [AuthModule, LobbyModule],
  controllers: [AppController],
  providers: [AppService, LobbyGateway],
})
export class AppModule {}
