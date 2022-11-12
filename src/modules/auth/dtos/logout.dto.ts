import { IsNotEmpty, IsString } from 'class-validator'

import { E_AuthType } from 'models/shared/app'

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  from: E_AuthType
}
