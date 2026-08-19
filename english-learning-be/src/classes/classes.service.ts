import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { RbacService } from "src/rbac/rbac.service";
import { Role } from "src/rbac/entities/role.entity";
import { AccountType, User } from "src/users/entities/user.entity";
import { CreateStudentDto } from "src/users/dto/create-student.dto";
import { UserProfileResponse } from "src/users/dto/user-profile-response.dto";
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from "src/workspaces/entities/workspace-member.entity";
import { AddClassStudentsDto } from "./dto/add-class-students.dto";
import { ClassDeleteResponseDto } from "./dto/class-delete-response.dto";
import { ClassRosterResponseDto } from "./dto/class-roster-response.dto";
import { ClassResponseDto } from "./dto/class-response.dto";
import { ClassStudentListItemDto } from "./dto/class-student-list-item.dto";
import { ClassStudentRoleResponseDto } from "./dto/class-student-role-response.dto";
import { ClassStudentsResponseDto } from "./dto/class-students-response.dto";
import { CreateClassStudentResponseDto } from "./dto/create-class-student-response.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassStudentRoleDto } from "./dto/update-class-student-role.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { ClassEntity } from "./entities/class.entity";
import { ClassStudent } from "./entities/class-student.entity";
import { WorkspaceAccessService } from "src/rbac/workspace-access.service";
import { errorPayload } from "src/common/utils/error-payload.util";
import { ClassStudentsAddedEvent } from "./events/class-students-added.event";
import { WorkspaceEntitlementService } from "src/workspaces/workspace-entitlement.service";
import { WorkspaceStudentsService } from "src/workspaces/workspace-students.service";

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
    private readonly workspaceEntitlementService: WorkspaceEntitlementService,
    private readonly workspaceStudentsService: WorkspaceStudentsService,
    private readonly rbacService: RbacService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createClass(
    workspaceId: string,
    dto: CreateClassDto,
  ): Promise<ClassResponseDto> {
    const workspace =
      await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);
    await this.workspaceEntitlementService.assertClassQuotaAvailable(
      workspaceId,
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
          "You already have a class with this name in this workspace",
          "CLASS_NAME_ALREADY_EXISTS",
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

  async listWorkspaceClasses(workspaceId: string): Promise<ClassResponseDto[]> {
    await this.workspaceAccessService.getWorkspaceOrThrow(workspaceId);

    const classes = await this.classRepo
      .createQueryBuilder("class")
      .innerJoinAndSelect("class.workspace", "workspace")
      .where("workspace.id = :workspaceId", { workspaceId })
      .loadRelationCountAndMap("class.studentCount", "class.classStudents")
      .orderBy("class.className", "ASC")
      .getMany();

    return classes.map((classEntity) =>
      ClassResponseDto.fromEntity(classEntity),
    );
  }

  async getClassDetail(classId: string): Promise<ClassResponseDto> {
    await this.workspaceAccessService.getClassOrThrow(classId);

    const classEntity = await this.classRepo
      .createQueryBuilder("class")
      .innerJoinAndSelect("class.workspace", "workspace")
      .where("class.id = :classId", { classId })
      .loadRelationCountAndMap("class.studentCount", "class.classStudents")
      .getOne();
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload("Class not found", "CLASS_NOT_FOUND"),
      );
    }

    return ClassResponseDto.fromEntity(classEntity);
  }

  async getClassStudents(classId: string): Promise<ClassRosterResponseDto> {
    await this.workspaceAccessService.getClassOrThrow(classId);

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
          fullName: "ASC",
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
  ): Promise<ClassResponseDto> {
    await this.workspaceAccessService.getClassOrThrow(classId);

    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: {
        workspace: true,
      },
    });
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload("Class not found", "CLASS_NOT_FOUND"),
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
            "You already have a class with this name in this workspace",
            "CLASS_NAME_ALREADY_EXISTS",
          ),
        );
      }

      classEntity.className = normalizedClassName;
    }

    if (dto.description !== undefined) {
      classEntity.description = dto.description.trim() || null;
    }

    const savedClass = await this.classRepo.save(classEntity);
    return this.getClassDetail(savedClass.id);
  }

  async addStudentsToClass(
    classId: string,
    dto: AddClassStudentsDto,
  ): Promise<ClassStudentsResponseDto> {
    const classEntity =
      await this.workspaceAccessService.getClassOrThrow(classId);
    const normalizedStudentIds = [...new Set(dto.studentIds)];
    const workspaceStudents = await this.getWorkspaceStudentsForClass(
      classEntity.workspace.id,
      normalizedStudentIds,
    );
    const defaultStudentRole =
      await this.rbacService.ensureDefaultClassStudentRole(classId);
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
    const newlyAddedStudentIds = workspaceStudents
      .filter((student) => !existingStudentIds.has(student.id))
      .map((student) => student.id);

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

    if (newlyAddedStudentIds.length > 0) {
      this.eventEmitter.emit(
        ClassStudentsAddedEvent.eventName,
        new ClassStudentsAddedEvent(
          classEntity.workspace.id,
          classId,
          newlyAddedStudentIds,
          new Date().toISOString(),
        ),
      );
    }

    return ClassStudentsResponseDto.fromData({
      classId,
      studentIds: finalAssignments.map((assignment) => assignment.student.id),
    });
  }

  async createStudentForClass(
    classId: string,
    dto: CreateStudentDto,
  ): Promise<CreateClassStudentResponseDto> {
    const classEntity =
      await this.workspaceAccessService.getClassOrThrow(classId);
    const defaultClassStudentRole =
      await this.rbacService.ensureDefaultClassStudentRole(classId);
    const createdStudent =
      await this.workspaceStudentsService.provisionWorkspaceStudent(
        classEntity.workspace,
        dto,
      );

    const existingAssignment = await this.classStudentRepo.findOne({
      where: {
        classEntity: { id: classId },
        student: { id: createdStudent.user.id },
      },
      relations: {
        role: true,
      },
    });

    if (existingAssignment) {
      return CreateClassStudentResponseDto.fromData({
        classId,
        workspaceId: classEntity.workspace.id,
        mode: "already_assigned",
        workspaceRole: createdStudent.workspaceRole.name,
        classRoleId: existingAssignment.role?.id || defaultClassStudentRole.id,
        classRoleName:
          existingAssignment.role?.name || defaultClassStudentRole.name,
        user: UserProfileResponse.fromEntity(createdStudent.user),
      });
    }

    await this.classStudentRepo.save(
      this.classStudentRepo.create({
        classEntity,
        student: createdStudent.user,
        role: defaultClassStudentRole,
      }),
    );

    this.eventEmitter.emit(
      ClassStudentsAddedEvent.eventName,
      new ClassStudentsAddedEvent(
        classEntity.workspace.id,
        classId,
        [createdStudent.user.id],
        new Date().toISOString(),
      ),
    );

    return CreateClassStudentResponseDto.fromData({
      classId,
      workspaceId: classEntity.workspace.id,
      mode: createdStudent.mode === "created" ? "created" : "attached",
      workspaceRole: createdStudent.workspaceRole.name,
      classRoleId: defaultClassStudentRole.id,
      classRoleName: defaultClassStudentRole.name,
      user: UserProfileResponse.fromEntity(createdStudent.user),
    });
  }

  async removeStudentFromClass(
    classId: string,
    studentId: string,
  ): Promise<ClassStudentsResponseDto> {
    await this.workspaceAccessService.getClassOrThrow(classId);

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
          "Student is not assigned to class",
          "CLASS_STUDENT_NOT_ASSIGNED",
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

  async deleteClass(classId: string): Promise<ClassDeleteResponseDto> {
    await this.workspaceAccessService.getClassOrThrow(classId);

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
          .from("role_permissions")
          .where('"roleId" IN (:...classRoleIds)', { classRoleIds })
          .execute();

        await manager.getRepository(Role).delete(classRoleIds);
      }

      await manager.getRepository(ClassEntity).delete(classId);
    });

    return ClassDeleteResponseDto.fromData({ classId });
  }

  async listMyClasses(studentId: string): Promise<ClassResponseDto[]> {
    const memberships = await this.classStudentRepo.find({
      where: {
        student: {
          id: studentId,
        },
      },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
      order: {
        classEntity: {
          className: "ASC",
        },
      },
    });

    return memberships.map((membership) =>
      ClassResponseDto.fromEntity(membership.classEntity),
    );
  }

  async updateClassStudentRole(
    classId: string,
    studentId: string,
    dto: UpdateClassStudentRoleDto,
  ): Promise<ClassStudentRoleResponseDto> {
    await this.workspaceAccessService.getClassOrThrow(classId);

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
          "Student is not assigned to class",
          "CLASS_STUDENT_NOT_ASSIGNED",
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
    const missingStudentIds = studentIds.filter(
      (id) => !foundStudentIds.has(id),
    );
    if (missingStudentIds.length > 0) {
      throw new BadRequestException(
        errorPayload(
          `Students do not belong to workspace: ${missingStudentIds.join(", ")}`,
          "CLASS_STUDENTS_OUTSIDE_WORKSPACE",
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
        errorPayload("Class role not found", "CLASS_ROLE_NOT_FOUND"),
      );
    }

    return role;
  }
}
