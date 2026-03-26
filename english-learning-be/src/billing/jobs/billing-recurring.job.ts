import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BillingService } from '../billing.service';

@Injectable()
export class BillingRecurringJob {
  private readonly logger = new Logger(BillingRecurringJob.name);

  constructor(private readonly billingService: BillingService) {}

  @Cron('*/10 * * * *')
  async handleRecurringBillingLifecycle(): Promise<void> {
    const renewedCount =
      await this.billingService.processDueMockRecurringRenewals();
    const finalizedCount =
      await this.billingService.finalizeEndedSubscriptions();

    if (renewedCount > 0 || finalizedCount > 0) {
      this.logger.log(
        `Processed billing lifecycle: renewed=${renewedCount}, finalized=${finalizedCount}`,
      );
    }
  }
}
