import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { PlanFeature } from "./plan-feature.entity";
import { PlanPrice } from "./plan-price.entity";

@Entity("plans")
@Index("uq_plans_code", ["code"], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  code: string;

  @Column({
    type: "varchar",
    length: 100,
  })
  name: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description: string | null;

  @Column({
    default: true,
  })
  isPublic: boolean;

  @Column({
    default: true,
  })
  isActive: boolean;

  @Column({
    type: "integer",
    default: 0,
  })
  sortOrder: number;

  @OneToMany(() => PlanFeature, (feature: PlanFeature) => feature.plan)
  features: PlanFeature[];

  @OneToMany(() => PlanPrice, (price: PlanPrice) => price.plan)
  prices: PlanPrice[];

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt: Date;
}
