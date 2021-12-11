import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(
    session({
      secret: 'keyboard cat', // в енв перенести
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3_600_000 },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(8000);
}
bootstrap();
