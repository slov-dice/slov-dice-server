import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: 'http://127.0.0.1:5173',
      credentials: true,
    },
  })
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(8000)
}
bootstrap()
