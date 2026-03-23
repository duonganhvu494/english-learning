import { ApiProperty } from '@nestjs/swagger';
import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';
import { AssignmentEntity } from '../entities/assignment.entity';
import { AssignmentType } from '../entities/assignment.entity';
import {
  AssignmentStatus,
  resolveAssignmentStatus,
} from '../utils/assignment-window.util';

export class AssignmentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440800' })
  id: string;

  @ApiProperty({ example: 'ASM-001', nullable: true })
  code: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440400' })
  sessionId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  classId: string;

  @ApiProperty({ enum: AssignmentType, example: AssignmentType.MANUAL })
  type: string;

  @ApiProperty({ example: 'Homework 01' })
  title: string;

  @ApiProperty({ example: 'Complete the worksheet before class', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-03-25T08:00:00.000Z' })
  timeStart: Date;

  @ApiProperty({ example: '2026-03-27T23:59:59.000Z' })
  timeEnd: Date;

  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.OPEN })
  status: AssignmentStatus;

  @ApiProperty({ type: [MaterialSummaryDto] })
  materials: MaterialSummaryDto[];

  @ApiProperty({ example: '2026-03-22T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-22T08:05:00.000Z' })
  updatedAt: Date;

  static fromEntity(assignment: AssignmentEntity): AssignmentResponseDto {
    const dto = new AssignmentResponseDto();
    dto.id = assignment.id;
    dto.code = assignment.code;
    dto.sessionId = assignment.session.id;
    dto.classId = assignment.session.classEntity.id;
    dto.type = assignment.type;
    dto.title = assignment.title;
    dto.description = assignment.description;
    dto.timeStart = assignment.timeStart;
    dto.timeEnd = assignment.timeEnd;
    dto.status = resolveAssignmentStatus(assignment);
    dto.materials = (assignment.assignmentMaterials ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((assignmentMaterial) =>
        MaterialSummaryDto.fromEntity(
          assignmentMaterial.material,
          `/assignments/${assignment.id}/materials/${assignmentMaterial.material.id}/download`,
        ),
      );
    dto.createdAt = assignment.createdAt;
    dto.updatedAt = assignment.updatedAt;
    return dto;
  }
}
