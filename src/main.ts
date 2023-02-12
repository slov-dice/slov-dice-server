import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'

import { AppModule } from './app.module'

async function bootstrap() {
  const whitelist = ['http://127.0.0.1:5173', 'http://localhost:5173']

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
    },
  })
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe())
  await app.listen('127.0.0.1:8000')
}
bootstrap()
