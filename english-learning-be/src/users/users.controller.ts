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
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SuperAdminGuard } from "src/auth/guards/super-admin.guard";
import type { AuthRequest } from "src/auth/interfaces/auth-request.interface";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiResponse } from "src/common/dto/api-response.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UserProfileResponse } from "./dto/user-profile-response.dto";
import { UserDeleteResponseDto } from "./dto/user-delete-response.dto";
import { RegisterUserResponseDto } from "./dto/register-user-response.dto";
import { VerifyEmailChangeOtpDto } from './dto/verify-email-change-otp.dto';

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("register")
  async register(
    @Body() dto: CreateUserDto,
  ): Promise<ApiResponse<RegisterUserResponseDto>> {
    const result = await this.usersService.register(dto);
    return ApiResponse.success(
      result,
      'Registration started. Verify your email to continue',
      201,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async listUsers(): Promise<ApiResponse<UserResponseDto[]>> {
    const result = await this.usersService.listUsers();
    return ApiResponse.success(result, "Users retrieved");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const result = await this.usersService.getUserById(req.user.userId);
    return ApiResponse.success(result, "User retrieved");
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getUserById(
    @Param("id") id: string,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const result = await this.usersService.getUserById(id);
    return ApiResponse.success(result, "User retrieved");
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Body() dto: UpdateUserDto,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const result = await this.usersService.updateProfile(req.user.userId, dto);
    return ApiResponse.success(result, "User updated", 200);
  }

  @Post("me/email/verify")
  @UseGuards(JwtAuthGuard)
  async verifyEmailChange(
    @Body() dto: VerifyEmailChangeOtpDto,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const result = await this.usersService.verifyEmailChange(
      req.user.userId,
      dto.otp,
    );

    return ApiResponse.success(result, "Email updated successfully");
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async remove(
    @Param("id") id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    const result = await this.usersService.remove(id);
    return ApiResponse.success(result, "User removed");
  }
}
