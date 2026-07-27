import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { BillingService } from './billing.service';
import { BillingSubscriptionResponseDto } from './dto/billing-subscription-response.dto';
import { MarkPaymentFailedDto } from './dto/mark-payment-failed.dto';
import { PaymentTransactionResponseDto } from './dto/payment-transaction-response.dto';
import { StartBillingSubscriptionResponseDto } from './dto/start-billing-subscription-response.dto';
import { StartBillingSubscriptionDto } from './dto/start-billing-subscription.dto';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('me/subscription')
  async getMyBillingSubscription(@Req() req: AuthRequest): Promise<ApiResponse<BillingSubscriptionResponseDto | null>> {
    const result = await this.billingService.getMyBillingSubscription(
      req.user.userId,
    );
    return ApiResponse.success(
      result ? BillingSubscriptionResponseDto.fromEntity(result) : null,
      'Current billing subscription retrieved',
    );
  }

  @Post('me/subscription')
  async startMyBillingSubscription(
    @Body() dto: StartBillingSubscriptionDto,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<StartBillingSubscriptionResponseDto>> {
    const result = await this.billingService.startMyWorkspacePlanSubscription(
      req.user.userId,
      dto.planCode,
    );
    return ApiResponse.success(
      StartBillingSubscriptionResponseDto.fromData(result),
      'Billing subscription started',
      201,
    );
  }

  @Post('mock/transactions/:transactionId/pay')
  async payMockTransaction(
    @Param('transactionId') transactionId: string,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<PaymentTransactionResponseDto>> {
    const result = await this.billingService.markMyTransactionPaid(
      req.user.userId,
      transactionId,
    );
    return ApiResponse.success(
      PaymentTransactionResponseDto.fromEntity(result),
      'Payment transaction marked as paid',
    );
  }

  @Post('mock/transactions/:transactionId/fail')
  async failMockTransaction(
    @Param('transactionId') transactionId: string,
    @Body() dto: MarkPaymentFailedDto,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<PaymentTransactionResponseDto>> {
    const result = await this.billingService.markMyTransactionFailed(
      req.user.userId,
      transactionId,
      dto.failureReason,
    );
    return ApiResponse.success(
      PaymentTransactionResponseDto.fromEntity(result),
      'Payment transaction marked as failed',
    );
  }

  @Post('me/subscription/cancel')
  async cancelMyBillingSubscription(@Req() req: AuthRequest): Promise<ApiResponse<BillingSubscriptionResponseDto>> {
    const result = await this.billingService.cancelMyBillingSubscription(
      req.user.userId,
    );
    return ApiResponse.success(
      BillingSubscriptionResponseDto.fromEntity(result),
      'Billing subscription will cancel at period end',
    );
  }
}
