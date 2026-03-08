import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionDeleteResponseDto } from './dto/session-delete-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionEntity } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
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
      throw new BadRequestException('Class not found');
    }

    const { timeStart, timeEnd } = this.parseSessionWindow(
      dto.timeStart,
      dto.timeEnd,
    );
    const normalizedTopic = dto.topic.trim();
    if (!normalizedTopic) {
      throw new BadRequestException('topic can not be empty');
    }

    const session = this.sessionRepo.create({
      classEntity,
      timeStart,
      timeEnd,
      topic: normalizedTopic,
    });
    const savedSession = await this.sessionRepo.save(session);

    return SessionResponseDto.fromEntity(savedSession);
  }

  async listClassSessions(classId: string): Promise<SessionResponseDto[]> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
    });
    if (!classEntity) {
      throw new BadRequestException('Class not found');
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
        timeStart: 'ASC',
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
      throw new BadRequestException('Session not found');
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
      throw new BadRequestException('Session not found');
    }

    const nextTimeStart = dto.timeStart ?? session.timeStart.toISOString();
    const nextTimeEnd = dto.timeEnd ?? session.timeEnd.toISOString();
    const { timeStart, timeEnd } = this.parseSessionWindow(
      nextTimeStart,
      nextTimeEnd,
    );

    session.timeStart = timeStart;
    session.timeEnd = timeEnd;

    if (dto.topic !== undefined) {
      const normalizedTopic = dto.topic.trim();
      if (!normalizedTopic) {
        throw new BadRequestException('topic can not be empty');
      }

      session.topic = normalizedTopic;
    }

    await this.sessionRepo.save(session);
    return SessionResponseDto.fromEntity(session);
  }

  async deleteSession(sessionId: string): Promise<SessionDeleteResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      select: {
        id: true,
      },
    });
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.sessionRepo.delete(sessionId);
    return SessionDeleteResponseDto.fromData({ sessionId });
  }

  private parseSessionWindow(
    timeStartInput: string,
    timeEndInput: string,
  ): { timeStart: Date; timeEnd: Date } {
    const timeStart = new Date(timeStartInput);
    const timeEnd = new Date(timeEndInput);

    if (Number.isNaN(timeStart.getTime()) || Number.isNaN(timeEnd.getTime())) {
      throw new BadRequestException('Session time is invalid');
    }

    if (timeEnd <= timeStart) {
      throw new BadRequestException('timeEnd must be greater than timeStart');
    }

    return { timeStart, timeEnd };
  }
}
