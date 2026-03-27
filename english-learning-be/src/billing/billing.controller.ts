import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import {
  ApiBusinessErrorResponses,
  ApiEnvelopeResponse,
} from 'src/common/swagger/swagger-response.decorator';
import { BillingService } from './billing.service';
import { BillingSubscriptionResponseDto } from './dto/billing-subscription-response.dto';
import { MarkPaymentFailedDto } from './dto/mark-payment-failed.dto';
import { PaymentTransactionResponseDto } from './dto/payment-transaction-response.dto';
import { StartBillingSubscriptionResponseDto } from './dto/start-billing-subscription-response.dto';
import { StartBillingSubscriptionDto } from './dto/start-billing-subscription.dto';

@ApiTags('Billing')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('me/subscription')
  @ApiOperation({
    summary: 'Get my current billing subscription',
    description:
      'Returns the current recurring billing subscription for the workspace owned by the authenticated teacher. It returns null when the workspace is still using only the default free plan.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Current billing subscription retrieved successfully',
    model: BillingSubscriptionResponseDto,
    isNullable: true,
    exampleMessage: 'Current billing subscription retrieved',
    exampleResult: null,
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'WORKSPACE_CURRENT_NOT_FOUND',
      message: 'Current workspace not found',
    },
  ])
  async myBillingSubscription(@Req() req: AuthRequest) {
    const result = await this.billingService.getMyBillingSubscription(
      req.user.userId,
    );
    return ApiResponse.success(
      result ? BillingSubscriptionResponseDto.fromEntity(result) : null,
      'Current billing subscription retrieved',
    );
  }

  @Post('me/subscription')
  @ApiOperation({
    summary: 'Start a paid billing subscription for my workspace',
    description:
      'Creates a recurring monthly billing subscription and the initial pending mock payment transaction for the current workspace owner.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Billing subscription started successfully',
    model: StartBillingSubscriptionResponseDto,
    exampleMessage: 'Billing subscription started',
    exampleResult: {
      billingSubscription: {
        id: '550e8400-e29b-41d4-a716-446655440910',
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        status: 'pending_activation',
        provider: 'mock',
        providerSubscriptionRef: 'mock-sub-1711446100000-k9x2fd',
        billingCycle: 'monthly',
        activatedAt: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        endedAt: null,
        plan: {
          id: '550e8400-e29b-41d4-a716-446655440701',
          code: 'starter',
          name: 'Starter',
          description: 'For growing English centers',
          monthlyPriceCents: 9900,
          isPublic: true,
          isActive: true,
          sortOrder: 2,
          features: [],
        },
      },
      paymentTransaction: {
        id: '550e8400-e29b-41d4-a716-446655440920',
        billingSubscriptionId: '550e8400-e29b-41d4-a716-446655440910',
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        planId: '550e8400-e29b-41d4-a716-446655440701',
        planCode: 'starter',
        type: 'initial_charge',
        status: 'pending',
        amountCents: 9900,
        billingPeriodStart: '2026-03-26T10:00:00.000Z',
        billingPeriodEnd: '2026-04-26T10:00:00.000Z',
        provider: 'mock',
        providerTransactionRef: null,
        paidAt: null,
        failedAt: null,
        failureReason: null,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'WORKSPACE_CURRENT_NOT_FOUND',
      message: 'Current workspace not found',
    },
    {
      status: 400,
      code: 'BILLING_PLAN_NOT_FOUND',
      message: 'Billing plan not found',
    },
    {
      status: 400,
      code: 'BILLING_PLAN_NOT_BILLABLE',
      message: 'Selected plan is not billable',
    },
    {
      status: 400,
      code: 'BILLING_SUBSCRIPTION_ALREADY_EXISTS',
      message: 'Workspace already has an active billing subscription',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async startMyBillingSubscription(
    @Body() dto: StartBillingSubscriptionDto,
    @Req() req: AuthRequest,
  ) {
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
  @ApiOperation({
    summary: 'Mock a successful payment transaction',
    description:
      'Marks a pending transaction as paid and applies the billing result to workspace entitlements. This mock endpoint is intended for demo and development flows.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Payment transaction marked as paid successfully',
    model: PaymentTransactionResponseDto,
    exampleMessage: 'Payment transaction marked as paid',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440920',
      billingSubscriptionId: '550e8400-e29b-41d4-a716-446655440910',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      planId: '550e8400-e29b-41d4-a716-446655440701',
      planCode: 'starter',
      type: 'initial_charge',
      status: 'paid',
      amountCents: 9900,
      billingPeriodStart: '2026-03-26T10:00:00.000Z',
      billingPeriodEnd: '2026-04-26T10:00:00.000Z',
      provider: 'mock',
      providerTransactionRef: 'mock-txn-1711446100000-a2fdk9',
      paidAt: '2026-03-26T10:00:05.000Z',
      failedAt: null,
      failureReason: null,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'WORKSPACE_CURRENT_NOT_FOUND',
      message: 'Current workspace not found',
    },
    {
      status: 400,
      code: 'BILLING_TRANSACTION_NOT_FOUND',
      message: 'Payment transaction not found',
    },
    {
      status: 400,
      code: 'BILLING_TRANSACTION_STATUS_INVALID',
      message: 'Only pending transactions can be marked as paid',
    },
  ])
  async payMockTransaction(
    @Param('transactionId') transactionId: string,
    @Req() req: AuthRequest,
  ) {
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
  @ApiOperation({
    summary: 'Mock a failed payment transaction',
    description:
      'Marks a pending transaction as failed and moves the billing subscription into a past-due state.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Payment transaction marked as failed successfully',
    model: PaymentTransactionResponseDto,
    exampleMessage: 'Payment transaction marked as failed',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440920',
      billingSubscriptionId: '550e8400-e29b-41d4-a716-446655440910',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      planId: '550e8400-e29b-41d4-a716-446655440701',
      planCode: 'starter',
      type: 'recurring_charge',
      status: 'failed',
      amountCents: 9900,
      billingPeriodStart: '2026-04-26T10:00:00.000Z',
      billingPeriodEnd: '2026-05-26T10:00:00.000Z',
      provider: 'mock',
      providerTransactionRef: null,
      paidAt: null,
      failedAt: '2026-04-26T10:00:05.000Z',
      failureReason: 'Card declined',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'WORKSPACE_CURRENT_NOT_FOUND',
      message: 'Current workspace not found',
    },
    {
      status: 400,
      code: 'BILLING_TRANSACTION_NOT_FOUND',
      message: 'Payment transaction not found',
    },
    {
      status: 400,
      code: 'BILLING_TRANSACTION_STATUS_INVALID',
      message: 'Only pending transactions can be marked as failed',
    },
  ])
  async failMockTransaction(
    @Param('transactionId') transactionId: string,
    @Body() dto: MarkPaymentFailedDto,
    @Req() req: AuthRequest,
  ) {
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
  @ApiOperation({
    summary: 'Cancel my billing subscription at period end',
    description:
      'Marks the current billing subscription to stop renewing after the current paid monthly period ends.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Billing subscription will cancel at period end',
    model: BillingSubscriptionResponseDto,
    exampleMessage: 'Billing subscription will cancel at period end',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440910',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      status: 'active',
      provider: 'mock',
      providerSubscriptionRef: 'mock-sub-1711446100000-k9x2fd',
      billingCycle: 'monthly',
      activatedAt: '2026-03-26T10:00:05.000Z',
      currentPeriodStart: '2026-03-26T10:00:00.000Z',
      currentPeriodEnd: '2026-04-26T10:00:00.000Z',
      cancelAtPeriodEnd: true,
      cancelledAt: '2026-03-27T09:30:00.000Z',
      endedAt: null,
      plan: {
        id: '550e8400-e29b-41d4-a716-446655440701',
        code: 'starter',
        name: 'Starter',
        description: 'For growing English centers',
        monthlyPriceCents: 9900,
        isPublic: true,
        isActive: true,
        sortOrder: 2,
        features: [],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or must change password first',
  })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'WORKSPACE_CURRENT_NOT_FOUND',
      message: 'Current workspace not found',
    },
    {
      status: 400,
      code: 'BILLING_SUBSCRIPTION_NOT_FOUND',
      message: 'Billing subscription not found',
    },
    {
      status: 400,
      code: 'BILLING_SUBSCRIPTION_STATUS_INVALID',
      message: 'Only active billing subscriptions can be cancelled at period end',
    },
  ])
  async cancelMyBillingSubscription(@Req() req: AuthRequest) {
    const result = await this.billingService.cancelMyBillingSubscription(
      req.user.userId,
    );
    return ApiResponse.success(
      BillingSubscriptionResponseDto.fromEntity(result),
      'Billing subscription will cancel at period end',
    );
  }
}
