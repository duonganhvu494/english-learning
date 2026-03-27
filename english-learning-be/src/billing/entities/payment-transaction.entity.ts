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
import {
  BillingProvider,
  BillingSubscription,
} from './billing-subscription.entity';

export enum PaymentTransactionType {
  INITIAL_CHARGE = 'initial_charge',
  RECURRING_CHARGE = 'recurring_charge',
}

export enum PaymentTransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('payment_transactions')
@Index('idx_payment_transactions_subscription_status', [
  'billingSubscription',
  'status',
])
@Index('idx_payment_transactions_workspace_created_at', [
  'workspace',
  'createdAt',
])
@Index(
  'uq_payment_transactions_subscription_period_type',
  ['billingSubscription', 'billingPeriodStart', 'billingPeriodEnd', 'type'],
  { unique: true },
)
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BillingSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billingSubscriptionId' })
  billingSubscription: BillingSubscription;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: PaymentTransactionType,
  })
  type: PaymentTransactionType;

  @Column({
    type: 'enum',
    enum: PaymentTransactionStatus,
  })
  status: PaymentTransactionStatus;

  @Column({ type: 'integer' })
  amountCents: number;

  @Column({ type: 'timestamptz' })
  billingPeriodStart: Date;

  @Column({ type: 'timestamptz' })
  billingPeriodEnd: Date;

  @Column({
    type: 'enum',
    enum: BillingProvider,
    default: BillingProvider.MOCK,
  })
  provider: BillingProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerTransactionRef: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
