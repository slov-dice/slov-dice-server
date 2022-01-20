import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';

// config.get<string>('DISCORD_CLIENT_SECRET')

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private config: ConfigService) {
    super({
      clientID: '921797570844577913',
      clientSecret: 'p86_XbpWIVIIRAkdgxXgGXIZoG9nEmDH',
      callbackURL: 'http://localhost:8000/auth/discord/redirect',
      scope: ['identify', 'email'],
    });
  }
  async validate(req: Request, at: string, rt: string, profile: any) {
    console.log(at, rt, profile);
  }
}
