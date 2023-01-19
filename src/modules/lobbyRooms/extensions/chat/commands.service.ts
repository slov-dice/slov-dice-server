import { Injectable } from '@nestjs/common'

@Injectable()
export class CommandsService {
  createCommand(text: string): string {
    const dices: number = +text.split('d')[0].substring(1) || 1
    const edges: number = +text.split('d')[1] || 6
    const getRandomValue = () => Math.floor(Math.random() * edges) + 1
    const values = [...new Array(dices)].map(getRandomValue)
    return values.join(' ')
  }
}
