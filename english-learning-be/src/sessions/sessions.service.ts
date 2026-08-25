import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassEntity } from "src/classes/entities/class.entity";
import { CreateSessionDto } from "./dto/create-session.dto";
import { SessionCancelledEvent } from "./events/session-cancelled.event";
import { SessionCreatedEvent } from "./events/session-created.event";
import { SessionDeleteResponseDto } from "./dto/session-delete-response.dto";
import { SessionResponseDto } from "./dto/session-response.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { SessionEntity } from "./entities/session.entity";
import { SessionUpdatedEvent } from "./events/session-updated.event";
import { errorPayload } from "src/common/utils/error-payload.util";
import { resolveNextSequentialCode } from "src/common/utils/sequential-code.util";

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSession(
    classId: string,
    dto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: {
        workspace: true,
      },
    });
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload("Class not found", "SESSION_CLASS_NOT_FOUND"),
      );
    }

    const { timeStart, timeEnd } = this.parseSessionWindow(
      dto.timeStart,
      dto.timeEnd,
    );

    const now = new Date();
    now.setSeconds(0, 0);

    if (timeStart < now) {
      throw new BadRequestException(
        errorPayload(
          "Session can not start in the past",
          "SESSION_TIME_START_IN_PAST",
        ),
      );
    }

    const normalizedTopic = dto.topic.trim();
    if (!normalizedTopic) {
      throw new BadRequestException(
        errorPayload("topic can not be empty", "SESSION_TOPIC_REQUIRED"),
      );
    }

    const scopedSessions = await this.sessionRepo.find({
      where: {
        classEntity: { id: classId },
      },
      select: {
        id: true,
        topic: true,
        timeStart: true,
        timeEnd: true,
        code: true,
      },
    });

    this.ensureNoDuplicateSession(
      scopedSessions,
      normalizedTopic,
      timeStart,
      timeEnd,
    );

    const session = this.sessionRepo.create({
      classEntity,
      timeStart,
      timeEnd,
      topic: normalizedTopic,
      code: resolveNextSequentialCode(
        "SES",
        scopedSessions.map((existingSession) => existingSession.code),
      ),
    });
    const savedSession = await this.sessionRepo.save(session);

    this.eventEmitter.emit(
      SessionCreatedEvent.eventName,
      new SessionCreatedEvent(savedSession.id, classId),
    );

    return SessionResponseDto.fromEntity(savedSession);
  }

  async listClassSessions(classId: string): Promise<SessionResponseDto[]> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
    });
    if (!classEntity) {
      throw new BadRequestException(
        errorPayload("Class not found", "SESSION_CLASS_NOT_FOUND"),
      );
    }

    const sessions = await this.sessionRepo.find({
      where: {
        classEntity: { id: classId },
      },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
      order: {
        timeStart: "ASC",
      },
    });

    return sessions.map((session) => SessionResponseDto.fromEntity(session));
  }

  async getSessionDetail(sessionId: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload("Session not found", "SESSION_NOT_FOUND"),
      );
    }

    return SessionResponseDto.fromEntity(session);
  }

  async updateSession(
    sessionId: string,
    dto: UpdateSessionDto,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload("Session not found", "SESSION_NOT_FOUND"),
      );
    }

    const previousTopic = session.topic;
    const previousTimeStart = session.timeStart.toISOString();
    const previousTimeEnd = session.timeEnd.toISOString();

    const nextTimeStart = dto.timeStart ?? session.timeStart.toISOString();
    const nextTimeEnd = dto.timeEnd ?? session.timeEnd.toISOString();
    const { timeStart, timeEnd } = this.parseSessionWindow(
      nextTimeStart,
      nextTimeEnd,
    );

    const nextTopic =
      dto.topic !== undefined ? dto.topic.trim() : session.topic;
    if (!nextTopic) {
      throw new BadRequestException(
        errorPayload("topic can not be empty", "SESSION_TOPIC_REQUIRED"),
      );
    }

    const scopedSessions = await this.sessionRepo.find({
      where: {
        classEntity: { id: session.classEntity.id },
      },
      select: {
        id: true,
        topic: true,
        timeStart: true,
        timeEnd: true,
        code: true,
      },
    });

    this.ensureNoDuplicateSession(
      scopedSessions,
      nextTopic,
      timeStart,
      timeEnd,
      session.id,
    );

    session.timeStart = timeStart;
    session.timeEnd = timeEnd;

    if (dto.topic !== undefined) {
      session.topic = nextTopic;
    }

    if (!session.code) {
      session.code = resolveNextSequentialCode(
        "SES",
        scopedSessions
          .filter((existingSession) => existingSession.id !== session.id)
          .map((existingSession) => existingSession.code),
      );
    }

    await this.sessionRepo.save(session);

    if (
      previousTopic !== session.topic ||
      previousTimeStart !== session.timeStart.toISOString() ||
      previousTimeEnd !== session.timeEnd.toISOString()
    ) {
      this.eventEmitter.emit(
        SessionUpdatedEvent.eventName,
        new SessionUpdatedEvent(
          session.id,
          previousTopic,
          previousTimeStart,
          previousTimeEnd,
          new Date().toISOString(),
        ),
      );
    }

    return SessionResponseDto.fromEntity(session);
  }

  async deleteSession(sessionId: string): Promise<SessionDeleteResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
      select: {
        id: true,
        topic: true,
        timeStart: true,
        timeEnd: true,
        classEntity: {
          id: true,
          workspace: {
            id: true,
          },
        },
      },
    });
    if (!session) {
      throw new BadRequestException(
        errorPayload("Session not found", "SESSION_NOT_FOUND"),
      );
    }

    await this.sessionRepo.delete(sessionId);
    this.eventEmitter.emit(
      SessionCancelledEvent.eventName,
      new SessionCancelledEvent(
        session.id,
        session.classEntity.workspace.id,
        session.classEntity.id,
        session.topic,
        session.timeStart.toISOString(),
        session.timeEnd.toISOString(),
        new Date().toISOString(),
      ),
    );
    return SessionDeleteResponseDto.fromData({ sessionId });
  }

  private parseSessionWindow(
    timeStartInput: string,
    timeEndInput: string,
  ): { timeStart: Date; timeEnd: Date } {
    const timeStart = new Date(timeStartInput);
    const timeEnd = new Date(timeEndInput);

    if (Number.isNaN(timeStart.getTime()) || Number.isNaN(timeEnd.getTime())) {
      throw new BadRequestException(
        errorPayload("Session time is invalid", "SESSION_TIME_INVALID"),
      );
    }

    if (timeEnd <= timeStart) {
      throw new BadRequestException(
        errorPayload(
          "timeEnd must be greater than timeStart",
          "SESSION_TIME_END_BEFORE_START",
        ),
      );
    }

    return { timeStart, timeEnd };
  }

  private ensureNoDuplicateSession(
    scopedSessions: Array<
      Pick<SessionEntity, "id" | "topic" | "timeStart" | "timeEnd">
    >,
    topic: string,
    timeStart: Date,
    timeEnd: Date,
    excludeSessionId?: string,
  ): void {
    const duplicateSession = scopedSessions.find((existingSession) => {
      if (existingSession.id === excludeSessionId) {
        return false;
      }

      return (
        existingSession.topic.toLowerCase() === topic.toLowerCase() &&
        existingSession.timeStart.getTime() === timeStart.getTime() &&
        existingSession.timeEnd.getTime() === timeEnd.getTime()
      );
    });

    if (duplicateSession) {
      throw new BadRequestException(
        errorPayload(
          "A session with the same topic and time window already exists in this class",
          "SESSION_DUPLICATE_IN_CLASS",
        ),
      );
    }
  }
}
