import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    example: '2026-03-22T08:00:00.000Z',
    description: 'Session start time in ISO 8601 format',
  })
  @IsDateString({}, { message: 'timeStart must be a valid ISO date string' })
  timeStart: string;

  @ApiProperty({
    example: '2026-03-22T10:00:00.000Z',
    description: 'Session end time in ISO 8601 format',
  })
  @IsDateString({}, { message: 'timeEnd must be a valid ISO date string' })
  timeEnd: string;

  @ApiProperty({
    example: 'Introduction to IELTS Writing Task 1',
    description: 'Teaching topic of the session',
  })
  @IsString({ message: 'topic must be a string' })
  @IsNotEmpty({ message: 'topic can not be empty' })
  @MaxLength(255, { message: 'topic is too long' })
  topic: string;
}
