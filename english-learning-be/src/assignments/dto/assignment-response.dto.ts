import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';
import { AssignmentEntity } from '../entities/assignment.entity';
import {
  AssignmentStatus,
  resolveAssignmentStatus,
} from '../utils/assignment-window.util';

export class AssignmentResponseDto {
  id: string;
  sessionId: string;
  classId: string;
  type: string;
  title: string;
  description: string | null;
  timeStart: Date;
  timeEnd: Date;
  status: AssignmentStatus;
  materials: MaterialSummaryDto[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(assignment: AssignmentEntity): AssignmentResponseDto {
    const dto = new AssignmentResponseDto();
    dto.id = assignment.id;
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
