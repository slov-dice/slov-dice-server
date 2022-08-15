import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

import { E_AuthType } from 'models/app'

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
}

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}

export class ThirdPartyDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  authType: E_AuthType
}

export class EmailConfirmDto {
  @IsString()
  @IsNotEmpty()
  token: string
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  from: E_AuthType
}
