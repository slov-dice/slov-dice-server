import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'

import { UsersService } from 'modules/users/users.service'

const weekInMilliseconds = 1000 * 60 * 60 * 24 * 7
const hourInMilliseconds = 1000 * 60 * 60

@Injectable()
export class TasksService {
  constructor(private usersService: UsersService) {}

  private readonly logger = new Logger(TasksService.name)

  @Interval(hourInMilliseconds)
  async handleInterval() {
    // TODO: Удалять гостя из LobbyUsers
    const users = await this.usersService.removeOldGuests()
    this.logger.debug(`Guests removed: ${users.count}`)
  }
}
