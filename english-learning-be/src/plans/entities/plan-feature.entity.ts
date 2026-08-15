import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Plan } from './plan.entity';

export enum PlanFeatureValueType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  JSON = 'json',
}

@Entity('plan_features')
@Index(
  'uq_plan_features_plan_feature_key',
  ['plan', 'featureKey'],
  {
    unique: true,
  },
)
@Index(
  'idx_plan_features_feature_key',
  ['featureKey'],
)
@Check(
  'CHK_plan_features_value_by_type',
  `(
    ("valueType" = 'boolean'
      AND "booleanValue" IS NOT NULL
      AND "numberValue" IS NULL
      AND "stringValue" IS NULL
      AND "jsonValue" IS NULL)

    OR

    ("valueType" = 'number'
      AND "booleanValue" IS NULL
      AND "numberValue" IS NOT NULL
      AND "stringValue" IS NULL
      AND "jsonValue" IS NULL)

    OR

    ("valueType" = 'string'
      AND "booleanValue" IS NULL
      AND "numberValue" IS NULL
      AND "stringValue" IS NOT NULL
      AND "jsonValue" IS NULL)

    OR

    ("valueType" = 'json'
      AND "booleanValue" IS NULL
      AND "numberValue" IS NULL
      AND "stringValue" IS NULL
      AND "jsonValue" IS NOT NULL)
  )`,
)
export class PlanFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Plan,
    (plan: Plan) => plan.features,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'planId',
  })
  plan: Plan;

  @Column({
    type: 'varchar',
    length: 100,
  })
  featureKey: string;

  @Column({
    type: 'enum',
    enum: PlanFeatureValueType,
  })
  valueType: PlanFeatureValueType;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  booleanValue: boolean | null;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  numberValue: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  stringValue: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  jsonValue:
    | Record<string, unknown>
    | unknown[]
    | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;
}