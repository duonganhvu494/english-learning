import { IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Username is not valid' })
  userName: string;

  @IsString({ message: 'Password is not valid' })
  password: string;
}
