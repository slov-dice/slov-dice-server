import { IsNotEmpty, IsString } from 'class-validator'

import { E_AuthType } from 'models/shared/app'

export class ThirdPartyDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  authType: E_AuthType
}
