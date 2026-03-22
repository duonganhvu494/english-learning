// src/workspaces/dto/create-workspace.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({
    example: 'English Center Alpha',
    description: 'Workspace name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
