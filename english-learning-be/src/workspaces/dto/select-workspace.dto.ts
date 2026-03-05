import { IsUUID } from 'class-validator';

export class SelectWorkspaceDto {
  @IsUUID('4', { message: 'workspaceId must be a valid UUID' })
  workspaceId: string;
}
