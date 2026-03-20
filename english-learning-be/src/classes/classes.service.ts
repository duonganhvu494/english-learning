import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RbacService } from 'src/rbac/rbac.service';
import { Role } from 'src/rbac/entities/role.entity';
import { AccountType, User } from 'src/users/entities/user.entity';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from 'src/workspaces/entities/workspace-member.entity';
import { AddClassStudentsDto } from './dto/add-class-students.dto';
import { ClassDeleteResponseDto } from './dto/class-delete-response.dto';
import { ClassRosterResponseDto } from './dto/class-roster-response.dto';
import { ClassResponseDto } from './dto/class-response.dto';
import { ClassStudentListItemDto } from './dto/class-student-list-item.dto';
import { ClassStudentRoleResponseDto } from './dto/class-student-role-response.dto';
import { ClassStudentsResponseDto } from './dto/class-students-response.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassStudentRoleDto } from './dto/update-class-student-role.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassEntity } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,

    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly rbacService: RbacService,
  ) {}

  async createClass(
    workspaceId: string,
    dto: CreateClassDto,
    actorUserId: string,
  ): Promise<ClassResponseDto> {
    const workspace = await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage:
          'Only workspace owner can manage workspace classes',
        ownerForbiddenCode: 'CLASS_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage workspace classes',
        teacherForbiddenCode: 'CLASS_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

    const normalizedClassName = dto.className.trim();
    const existedClass = await this.classRepo.findOne({
      where: {
        className: normalizedClassName,
        workspace: { id: workspaceId },
      },
      relations: {
        workspace: true,
      },
    });
    if (existedClass) {
      throw new BadRequestException(
        errorPayload(
          'You already have a class with this name in this workspace',
          'CLASS_NAME_ALREADY_EXISTS',
        ),
      );
    }

    const classEntity = this.classRepo.create({
      className: normalizedClassName,
      description: dto.description?.trim() || null,
      workspace,
    });
    const savedClass = await this.classRepo.save(classEntity);
    await this.rbacService.ensureDefaultClassStudentRole(savedClass.id);

    return ClassResponseDto.fromEntity(savedClass);
  }

  async listWorkspaceClasses(
    workspaceId: string,
    actorUserId: string,
  ): Promise<ClassResponseDto[]> {
    await this.workspaceAccessService.assertTeacherWorkspaceOwner(
      workspaceId,
      actorUserId,
      {
        notFoundCode: 'WORKSPACE_NOT_FOUND',
        ownerForbiddenMessage:
          'Only workspace owner can manage workspace classes',
        ownerForbiddenCode: 'CLASS_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage workspace classes',
        teacherForbiddenCode: 'CLASS_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

    const classes = await this.classRepo
      .createQueryBuilder('class')
      .innerJoinAndSelect('class.workspace', 'workspace')
      .where('workspace.id = :workspaceId', { workspaceId })
      .loadRelationCountAndMap('class.studentCount', 'class.classStudents')
      .orderBy('class.className', 'ASC')
      .getMany();

    return classes.map((classEntity) => ClassResponseDto.fromEntity(classEntity));
  }

  async getClassDetail(
    classId: string,
    actorUserId: string,
  ): Promise<ClassResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can access class detail',
        ownerForbiddenCode: 'CLASS_DETAIL_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can access class detail',
        teacherForbiddenCode: 'CLASS_DETAIL_TEACHER_OWNER_REQUIRED',
      },
    );

    const classEntity = await this.classRepo
      .createQueryBuilder('class')
      .innerJoinAndSelect('class.workspace', 'workspace')
      .where('class.id = :classId', { classId })
      .loadRelationCountAndMap('class.studentCount', 'class.classStudents')
      .getOne();
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload('Class not found', 'CLASS_NOT_FOUND'),
      );
    }

    return ClassResponseDto.fromEntity(classEntity);
  }

  async getClassStudents(
    classId: string,
    actorUserId: string,
  ): Promise<ClassRosterResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can access class students',
        ownerForbiddenCode: 'CLASS_STUDENT_ACCESS_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can access class students',
        teacherForbiddenCode: 'CLASS_STUDENT_ACCESS_TEACHER_OWNER_REQUIRED',
      },
    );

    const assignments = await this.classStudentRepo.find({
      where: {
        classEntity: { id: classId },
      },
      relations: {
        student: true,
        role: true,
      },
      order: {
        student: {
          fullName: 'ASC',
        },
      },
    });

    return ClassRosterResponseDto.fromData({
      classId,
      students: assignments.map((assignment) =>
        ClassStudentListItemDto.fromEntity(assignment),
      ),
    });
  }

  async updateClass(
    classId: string,
    dto: UpdateClassDto,
    actorUserId: string,
  ): Promise<ClassResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can manage workspace classes',
        ownerForbiddenCode: 'CLASS_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage workspace classes',
        teacherForbiddenCode: 'CLASS_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: {
        workspace: true,
      },
    });
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload('Class not found', 'CLASS_NOT_FOUND'),
      );
    }

    if (dto.className !== undefined) {
      const normalizedClassName = dto.className.trim();
      const existedClass = await this.classRepo.findOne({
        where: {
          className: normalizedClassName,
          workspace: { id: classEntity.workspace.id },
        },
        relations: {
          workspace: true,
        },
      });

      if (existedClass && existedClass.id !== classEntity.id) {
        throw new BadRequestException(
          errorPayload(
            'You already have a class with this name in this workspace',
            'CLASS_NAME_ALREADY_EXISTS',
          ),
        );
      }

      classEntity.className = normalizedClassName;
    }

    if (dto.description !== undefined) {
      classEntity.description = dto.description.trim() || null;
    }

    const savedClass = await this.classRepo.save(classEntity);
    return this.getClassDetail(savedClass.id, actorUserId);
  }

  async addStudentsToClass(
    classId: string,
    dto: AddClassStudentsDto,
    actorUserId: string,
  ): Promise<ClassStudentsResponseDto> {
    const classEntity = await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can manage class students',
        ownerForbiddenCode: 'CLASS_STUDENT_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class students',
        teacherForbiddenCode: 'CLASS_STUDENT_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );
    const normalizedStudentIds = [...new Set(dto.studentIds)];
    const workspaceStudents = await this.getWorkspaceStudentsForClass(
      classEntity.workspace.id,
      normalizedStudentIds,
    );
    const defaultStudentRole = await this.rbacService.ensureDefaultClassStudentRole(
      classId,
    );
    const existingAssignments = await this.classStudentRepo.find({
      where: {
        classEntity: { id: classId },
        student: { id: In(normalizedStudentIds) },
      },
      relations: {
        student: true,
        role: true,
      },
    });
    const existingStudentIds = new Set(
      existingAssignments.map((assignment) => assignment.student.id),
    );

    await this.classStudentRepo.manager.transaction(async (manager) => {
      const classStudentRepo = manager.getRepository(ClassStudent);
      for (const student of workspaceStudents) {
        if (existingStudentIds.has(student.id)) {
          continue;
        }

        const classStudent = classStudentRepo.create({
          classEntity,
          student,
          role: defaultStudentRole,
        });
        await classStudentRepo.save(classStudent);
      }

      for (const assignment of existingAssignments) {
        if (assignment.role) {
          continue;
        }

        assignment.role = defaultStudentRole;
        await classStudentRepo.save(assignment);
      }
    });

    const finalAssignments = await this.classStudentRepo.find({
      where: { classEntity: { id: classId } },
      relations: {
        student: true,
      },
    });

    return ClassStudentsResponseDto.fromData({
      classId,
      studentIds: finalAssignments.map((assignment) => assignment.student.id),
    });
  }

  async removeStudentFromClass(
    classId: string,
    studentId: string,
    actorUserId: string,
  ): Promise<ClassStudentsResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can manage class students',
        ownerForbiddenCode: 'CLASS_STUDENT_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class students',
        teacherForbiddenCode: 'CLASS_STUDENT_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

    const assignment = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: classId },
        student: { id: studentId },
      },
      relations: {
        student: true,
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        errorPayload(
          'Student is not assigned to class',
          'CLASS_STUDENT_NOT_ASSIGNED',
        ),
      );
    }

    await this.classStudentRepo.remove(assignment);

    const remainingAssignments = await this.classStudentRepo.find({
      where: { classEntity: { id: classId } },
      relations: {
        student: true,
      },
    });

    return ClassStudentsResponseDto.fromData({
      classId,
      studentIds: remainingAssignments.map((item) => item.student.id),
    });
  }

  async deleteClass(
    classId: string,
    actorUserId: string,
  ): Promise<ClassDeleteResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can delete class',
        ownerForbiddenCode: 'CLASS_DELETE_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can delete class',
        teacherForbiddenCode: 'CLASS_DELETE_TEACHER_OWNER_REQUIRED',
      },
    );

    await this.classRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(ClassStudent)
        .where('"classId" = :classId', { classId })
        .execute();

      const classRoles = await manager.getRepository(Role).find({
        where: {
          classId,
          isSystem: false,
        },
        select: {
          id: true,
        },
      });
      const classRoleIds = classRoles.map((role) => role.id);

      if (classRoleIds.length > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('role_permissions')
          .where('"roleId" IN (:...classRoleIds)', { classRoleIds })
          .execute();

        await manager.getRepository(Role).delete(classRoleIds);
      }

      await manager.getRepository(ClassEntity).delete(classId);
    });

    return ClassDeleteResponseDto.fromData({ classId });
  }

  async updateClassStudentRole(
    classId: string,
    studentId: string,
    dto: UpdateClassStudentRoleDto,
    actorUserId: string,
  ): Promise<ClassStudentRoleResponseDto> {
    await this.workspaceAccessService.assertTeacherClassOwner(
      classId,
      actorUserId,
      {
        notFoundCode: 'CLASS_NOT_FOUND',
        ownerForbiddenMessage: 'Only workspace owner can manage class roles',
        ownerForbiddenCode: 'CLASS_ROLE_MANAGEMENT_OWNER_REQUIRED',
        teacherForbiddenMessage:
          'Only teacher workspace owner can manage class roles',
        teacherForbiddenCode: 'CLASS_ROLE_MANAGEMENT_TEACHER_OWNER_REQUIRED',
      },
    );

    const assignment = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: classId },
        student: { id: studentId },
      },
      relations: {
        role: true,
      },
    });
    if (!assignment) {
      throw new BadRequestException(
        errorPayload(
          'Student is not assigned to class',
          'CLASS_STUDENT_NOT_ASSIGNED',
        ),
      );
    }

    const nextRole = await this.findClassRoleForAssignment(classId, dto.roleId);
    assignment.role = nextRole;
    const savedAssignment = await this.classStudentRepo.save(assignment);

    return ClassStudentRoleResponseDto.fromData({
      classId,
      studentId,
      role: savedAssignment.role ?? nextRole,
    });
  }

  private async getWorkspaceStudentsForClass(
    workspaceId: string,
    studentIds: string[],
  ): Promise<User[]> {
    if (studentIds.length === 0) {
      return [];
    }

    const members = await this.memberRepo.find({
      where: {
        workspace: { id: workspaceId },
        user: { id: In(studentIds), accountType: AccountType.STUDENT },
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: {
        user: true,
      },
    });

    const foundStudentIds = new Set(members.map((member) => member.user.id));
    const missingStudentIds = studentIds.filter((id) => !foundStudentIds.has(id));
    if (missingStudentIds.length > 0) {
      throw new BadRequestException(
        errorPayload(
          `Students do not belong to workspace: ${missingStudentIds.join(', ')}`,
          'CLASS_STUDENTS_OUTSIDE_WORKSPACE',
        ),
      );
    }

    return members.map((member) => member.user);
  }

  private async findClassRoleForAssignment(
    classId: string,
    roleId?: string | null,
  ): Promise<Role> {
    if (!roleId) {
      return this.rbacService.ensureDefaultClassStudentRole(classId);
    }

    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
        classId,
        isSystem: false,
      },
    });
    if (!role) {
      throw new BadRequestException(
        errorPayload('Class role not found', 'CLASS_ROLE_NOT_FOUND'),
      );
    }

    return role;
  }
}
