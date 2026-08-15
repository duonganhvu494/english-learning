import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingSubscription } from './entities/billing-subscription.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { Plan } from 'src/workspaces/entities/plan.entity';
import { WorkspaceSubscription } from 'src/workspaces/entities/workspace-subscription.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StripeService } from './stripe/stripe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillingSubscription,
      PaymentTransaction,
      Workspace,
      Plan,
      WorkspaceSubscription,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, StripeService,],
  exports: [TypeOrmModule, BillingService],
})
export class BillingModule {}
