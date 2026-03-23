import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';

export class ChangePasswordResponseDto {
  @ApiProperty({ type: UserProfileResponse })
  user: UserProfileResponse;
}
