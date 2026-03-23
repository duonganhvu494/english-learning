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
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/auth/guards/super-admin.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { UserProfileResponse } from './dto/user-profile-response.dto';
import { UserDeleteResponseDto } from './dto/user-delete-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post("register")
    @ApiOperation({
        summary: 'Register teacher account',
        description: 'Registers a new teacher account in the system.',
    })
    @ApiEnvelopeResponse({
        status: 201,
        description: 'Teacher account created successfully',
        model: UserResponseDto,
        exampleMessage: 'User created',
        exampleResult: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            fullName: 'Duong Anh Vu',
            userName: 'duonganhvu',
            email: 'duonganhvu@example.com',
            accountType: 'teacher',
            mustChangePassword: false,
            isActive: true,
        },
    })
    @ApiBusinessErrorResponses([
        {
            status: 400,
            code: 'USER_CREDENTIALS_ALREADY_EXIST',
            message: 'Email or username already exists',
        },
        {
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
        },
    ])
    async register(@Body() dto: CreateUserDto) {
        const result = await this.usersService.register(dto);
        return ApiResponse.success(result, 'User created', 201);
    }

    @Get()
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @ApiOperation({
        summary: 'List users',
        description: 'Returns all users. Super admin access required.',
    })
    @ApiCookieAuth('cookieAuth')
    @ApiEnvelopeResponse({
        status: 200,
        description: 'Users retrieved successfully',
        model: UserResponseDto,
        isArray: true,
        exampleMessage: 'Users retrieved',
        exampleResult: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                fullName: 'Duong Anh Vu',
                userName: 'duonganhvu',
                email: 'duonganhvu@example.com',
                accountType: 'teacher',
                mustChangePassword: false,
                isActive: true,
            },
        ],
    })
    @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
    @ApiForbiddenResponse({ description: 'Super admin access is required' })
    @ApiBusinessErrorResponses([
        {
            status: 401,
            code: 'AUTH_UNAUTHORIZED',
            message: 'Unauthorized',
        },
        {
            status: 403,
            code: 'AUTH_SUPER_ADMIN_REQUIRED',
            message: 'Super admin access required',
        },
    ])
    async findAll() {
        const result = await this.usersService.findAll();
        return ApiResponse.success(result, 'Users retrieved');
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @ApiOperation({
        summary: 'Get user by ID',
        description: 'Returns a user profile by ID. Super admin access required.',
    })
    @ApiCookieAuth('cookieAuth')
    @ApiEnvelopeResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        model: UserProfileResponse,
        exampleMessage: 'User retrieved',
        exampleResult: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            userName: 'duonganhvu',
            fullName: 'Duong Anh Vu',
            email: 'duonganhvu@example.com',
            mustChangePassword: false,
        },
    })
    @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
    @ApiForbiddenResponse({ description: 'Super admin access is required' })
    @ApiBusinessErrorResponses([
        {
            status: 401,
            code: 'AUTH_UNAUTHORIZED',
            message: 'Unauthorized',
        },
        {
            status: 403,
            code: 'AUTH_SUPER_ADMIN_REQUIRED',
            message: 'Super admin access required',
        },
        {
            status: 400,
            code: 'USER_NOT_FOUND',
            message: 'User not found',
        },
    ])
    async findOne(@Param('id') id: string) {
        const result = await this.usersService.getUserById(id);
        return ApiResponse.success(result, 'User retrieved');
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Update my profile',
        description: 'Updates the profile of the currently authenticated user.',
    })
    @ApiCookieAuth('cookieAuth')
    @ApiSecurity('csrfHeader')
    @ApiEnvelopeResponse({
        status: 200,
        description: 'Current user profile updated successfully',
        model: UserProfileResponse,
        exampleMessage: 'User updated',
        exampleResult: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            userName: 'duonganhvu',
            fullName: 'Duong Anh Vu',
            email: 'duonganhvu@example.com',
            mustChangePassword: false,
        },
    })
    @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
    @ApiBusinessErrorResponses([
        {
            status: 401,
            code: 'AUTH_UNAUTHORIZED',
            message: 'Unauthorized',
        },
        {
            status: 401,
            code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
            message: 'Password change is required before accessing this resource',
        },
        {
            status: 400,
            code: 'USER_NOT_FOUND',
            message: 'User not found',
        },
        {
            status: 400,
            code: 'USER_EMAIL_ALREADY_EXISTS',
            message: 'Email already exists',
        },
        {
            status: 400,
            code: 'USER_USERNAME_ALREADY_EXISTS',
            message: 'Username already exists',
        },
        {
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
        },
    ])
    async updateMe(@Body() dto: UpdateUserDto, @Req() req: AuthRequest) {
        const result = await this.usersService.updateProfile(req.user.userId, dto);
        return ApiResponse.success(result, 'User updated', 200);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @ApiOperation({
        summary: 'Deactivate user',
        description: 'Soft-deletes a user by marking the account inactive. Super admin access required.',
    })
    @ApiCookieAuth('cookieAuth')
    @ApiSecurity('csrfHeader')
    @ApiEnvelopeResponse({
        status: 200,
        description: 'User deactivated successfully',
        model: UserDeleteResponseDto,
        exampleMessage: 'User removed',
        exampleResult: {
            deleted: true,
        },
    })
    @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
    @ApiForbiddenResponse({ description: 'Super admin access is required' })
    @ApiBusinessErrorResponses([
        {
            status: 401,
            code: 'AUTH_UNAUTHORIZED',
            message: 'Unauthorized',
        },
        {
            status: 403,
            code: 'AUTH_SUPER_ADMIN_REQUIRED',
            message: 'Super admin access required',
        },
        {
            status: 400,
            code: 'USER_NOT_FOUND',
            message: 'User not found',
        },
    ])
    async remove(@Param('id') id: string) {
        const result = await this.usersService.remove(id);
        return ApiResponse.success(result, 'User removed');
    }
}
