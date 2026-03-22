import { ApiProperty } from '@nestjs/swagger';
import { SessionEntity } from '../entities/session.entity';

export class SessionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440400' })
  id: string;

  @ApiProperty({ example: 'SES-001', nullable: true })
  code: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: '2026-03-22T08:00:00.000Z' })
  timeStart: string;

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z' })
  timeEnd: string;

  @ApiProperty({ example: 'Grammar revision' })
  topic: string;

  static fromEntity(sessionEntity: SessionEntity): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.id = sessionEntity.id;
    dto.code = sessionEntity.code;
    dto.classId = sessionEntity.classEntity.id;
    dto.workspaceId = sessionEntity.classEntity.workspace.id;
    dto.timeStart = sessionEntity.timeStart.toISOString();
    dto.timeEnd = sessionEntity.timeEnd.toISOString();
    dto.topic = sessionEntity.topic;
    return dto;
  }
}
