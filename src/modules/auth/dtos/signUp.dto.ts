import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { E_Locale } from 'models/shared/app'

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  nickname: string

  @IsString()
  @IsNotEmpty()
  password: string

  @IsString()
  @IsNotEmpty()
  language: E_Locale
}
