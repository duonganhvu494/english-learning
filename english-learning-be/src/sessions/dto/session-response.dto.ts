import { SessionEntity } from '../entities/session.entity';

export class SessionResponseDto {
  id: string;
  classId: string;
  workspaceId: string;
  timeStart: string;
  timeEnd: string;
  topic: string;

  static fromEntity(sessionEntity: SessionEntity): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.id = sessionEntity.id;
    dto.classId = sessionEntity.classEntity.id;
    dto.workspaceId = sessionEntity.classEntity.workspace.id;
    dto.timeStart = sessionEntity.timeStart.toISOString();
    dto.timeEnd = sessionEntity.timeEnd.toISOString();
    dto.topic = sessionEntity.topic;
    return dto;
  }
}
