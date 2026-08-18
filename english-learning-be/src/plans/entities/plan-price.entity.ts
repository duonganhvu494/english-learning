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
} from "typeorm";

import { Plan } from "./plan.entity";

export enum PlanBillingInterval {
  MONTHLY = "monthly",
}

@Entity("plan_prices")
@Index("idx_plan_prices_plan_active", ["plan", "isActive"])
@Index(
  "uq_plan_prices_active_plan_currency_interval",
  ["plan", "currency", "interval"],
  {
    unique: true,
    where: '"isActive" = true',
  },
)
@Index("uq_plan_prices_stripe_price_id", ["stripePriceId"], {
  unique: true,
  where: '"stripePriceId" IS NOT NULL',
})
@Check("CHK_plan_prices_amount_non_negative", '"amount" >= 0')
export class PlanPrice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Plan, (plan: Plan) => plan.prices, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "planId",
  })
  plan: Plan;

  @Column({
    type: "integer",
  })
  amount: number;

  @Column({
    type: "varchar",
    length: 3,
  })
  currency: string;

  @Column({
    type: "enum",
    enum: PlanBillingInterval,
  })
  interval: PlanBillingInterval;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripePriceId: string | null;

  @Column({
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt: Date;
}
