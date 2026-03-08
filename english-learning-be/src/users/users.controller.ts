import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/auth/guards/super-admin.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
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

    @Get()
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async findAll() {
        const result = await this.usersService.findAll();
        return ApiResponse.success(result, 'Users retrieved');
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@Req() req: AuthRequest) {
        const result = await this.usersService.getUserById(req.user.userId);
        return ApiResponse.success(result, 'User retrieved');
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async findOne(@Param('id') id: string) {
        const result = await this.usersService.getUserById(id);
        return ApiResponse.success(result, 'User retrieved');
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    async updateMe(@Body() dto: UpdateUserDto, @Req() req: AuthRequest) {
        const result = await this.usersService.updateProfile(req.user.userId, dto);
        return ApiResponse.success(result, 'User updated', 200);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async remove(@Param('id') id: string) {
        const result = await this.usersService.remove(id);
        return ApiResponse.success(result, 'User removed');
    }
}
