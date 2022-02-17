import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

import { AuthTypeEnum } from 'interfaces/app'

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
  authType: AuthTypeEnum
}

export class EmailConfirmDto {
  @IsString()
  @IsNotEmpty()
  token: string
}

export class RestoreDto {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string

  @IsString()
  @IsNotEmpty()
  password: string
}
