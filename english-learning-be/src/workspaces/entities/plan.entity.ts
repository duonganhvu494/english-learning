import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanFeature } from './plan-feature.entity';
import { WorkspaceSubscription } from './workspace-subscription.entity';

@Entity('plans')
@Index('uq_plans_code', ['code'], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', nullable: true })
  monthlyPriceCents: number | null;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @OneToMany(() => PlanFeature, (feature: PlanFeature) => feature.plan)
  features: PlanFeature[];

  @OneToMany(
    () => WorkspaceSubscription,
    (subscription: WorkspaceSubscription) => subscription.plan,
  )
  workspaceSubscriptions: WorkspaceSubscription[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
