import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface IUser {
  id: string;
  username: string;
  password: string;
  nickname: string;
}

@Injectable()
export class UsersService {
  private readonly users: IUser[] = [
    {
      id: uuidv4(),
      username: 'test1',
      password: 'test1',
      nickname: 'Yaro',
    },
    {
      id: uuidv4(),
      username: 'test2',
      password: 'test2',
      nickname: 'Bobo',
    },
  ];

  async findOne(username: string): Promise<IUser | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
