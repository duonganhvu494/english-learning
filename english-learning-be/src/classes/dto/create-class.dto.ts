import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClassDto {
  @IsString({ message: 'className must be a string' })
  @IsNotEmpty({ message: 'className can not be empty' })
  @MaxLength(100, { message: 'className is too long' })
  className: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(255, { message: 'description is too long' })
  description?: string;
}
