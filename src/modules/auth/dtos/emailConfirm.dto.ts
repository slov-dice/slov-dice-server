import { IsNotEmpty, IsString } from 'class-validator'

export class EmailConfirmDto {
  @IsString()
  @IsNotEmpty()
  token: string
}
