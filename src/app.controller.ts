import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import { AuthLocalGuard } from './guards/auth-local.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(AuthLocalGuard)
  @Post('login')
  login(@Request() req): any {
    return { data: req.user, message: 'Logged in!' };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('protected')
  getHello(@Request() req): string {
    return req.user;
  }
}
