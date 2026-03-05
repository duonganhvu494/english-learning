import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from 'src/common/dto/api-response.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post("register")
    async register(@Body() dto: CreateUserDto) {
        const result = await this.usersService.register(dto);
        return ApiResponse.success(result, 'User created');
    }

    @Post("create-student")
    async createStudent(@Body() dto: CreateStudentDto) {
        const result = await this.usersService.createStudent(dto);
        return ApiResponse.success(result, 'Student created');
    }

    @Get()
    async findAll() {
        const result = await this.usersService.findAll();
        return ApiResponse.success(result, 'Users retrieved');
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.usersService.getUserById(id);
        return ApiResponse.success(result, 'User retrieved');
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        const result = await this.usersService.update(id, dto);
        return ApiResponse.success(result, 'User updated', 200);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const result = await this.usersService.remove(id);
        return ApiResponse.success(result, 'User removed');
    }
}
