import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { Plan } from 'src/workspaces/entities/plan.entity';

export enum BillingProvider {
  MOCK = 'mock',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
}

export enum BillingSubscriptionStatus {
  PENDING_ACTIVATION = 'pending_activation',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('billing_subscriptions')
@Index('idx_billing_subscriptions_workspace_status', ['workspace', 'status'])
@Index('idx_billing_subscriptions_plan_status', ['plan', 'status'])
@Index('uq_billing_subscriptions_current_workspace', ['workspace'], {
  unique: true,
  where: '"endedAt" IS NULL',
})
export class BillingSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: BillingSubscriptionStatus,
  })
  status: BillingSubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingProvider,
    default: BillingProvider.MOCK,
  })
  provider: BillingProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerSubscriptionRef: string | null;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
