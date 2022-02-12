import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

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
  authType: AuthType
}

export enum AuthType {
  google = 'GOOGLE',
  discord = 'DISCORD',
  email = 'EMAIL',
  guest = 'GUEST',
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
