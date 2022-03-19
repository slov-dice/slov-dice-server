import { Module } from '@nestjs/common'

import { TasksService } from './tasks.service'
import { UsersService } from 'modules/users/users.service'

@Module({
  providers: [TasksService, UsersService],
})
export class TasksModule {}
