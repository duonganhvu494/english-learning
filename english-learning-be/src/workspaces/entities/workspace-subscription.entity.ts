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
import { PaymentTransaction } from 'src/billing/entities/payment-transaction.entity';
import { Workspace } from './workspace.entity';
import { Plan } from './plan.entity';

export enum WorkspaceSubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum WorkspaceSubscriptionSource {
  WORKSPACE_CREATION = 'workspace_creation',
  BILLING_PAYMENT = 'billing_payment',
  BILLING_FALLBACK = 'billing_fallback',
  ADMIN_OVERRIDE = 'admin_override',
}

@Entity('workspace_subscriptions')
@Index('idx_workspace_subscriptions_workspace_status', ['workspace', 'status'])
@Index('idx_workspace_subscriptions_plan_status', ['plan', 'status'])
@Index('uq_workspace_subscriptions_active_workspace', ['workspace'], {
  unique: true,
  where: `"status" IN ('active', 'trialing')`,
})
export class WorkspaceSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, (workspace: Workspace) => workspace.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Plan, (plan: Plan) => plan.workspaceSubscriptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: WorkspaceSubscriptionStatus,
  })
  status: WorkspaceSubscriptionStatus;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({
    type: 'enum',
    enum: WorkspaceSubscriptionSource,
  })
  source: WorkspaceSubscriptionSource;

  @Column({ type: 'uuid', nullable: true })
  paymentTransactionId: string | null;

  @ManyToOne(() => PaymentTransaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentTransactionId' })
  paymentTransaction: PaymentTransaction | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
