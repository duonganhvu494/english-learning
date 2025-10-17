import { IsBoolean, IsOptional } from "class-validator";
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
