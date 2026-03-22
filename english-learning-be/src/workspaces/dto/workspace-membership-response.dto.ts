import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceMembershipResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: 'English Center Alpha' })
  workspaceName: string;

  @ApiProperty({ example: 'owner' })
  role: string;
}
