import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsDateString({}, { message: 'timeStart must be a valid ISO date string' })
  timeStart: string;

  @IsDateString({}, { message: 'timeEnd must be a valid ISO date string' })
  timeEnd: string;

  @IsString({ message: 'topic must be a string' })
  @IsNotEmpty({ message: 'topic can not be empty' })
  @MaxLength(255, { message: 'topic is too long' })
  topic: string;
}
