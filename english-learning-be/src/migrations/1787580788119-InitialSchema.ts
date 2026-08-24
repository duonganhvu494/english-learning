import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787580788119 implements MigrationInterface {
    name = 'InitialSchema1787580788119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_accounttype_enum" AS ENUM('teacher', 'student')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "userName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "mustChangePassword" boolean NOT NULL DEFAULT false, "emailVerificationRequired" boolean NOT NULL DEFAULT false, "emailVerifiedAt" TIMESTAMP WITH TIME ZONE, "accountType" "public"."users_accounttype_enum" NOT NULL, "isSuperAdmin" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying NOT NULL, "resource" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_7331684c0c5b063803a425001a0" UNIQUE ("action", "resource"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roleId" uuid, "permissionId" uuid, CONSTRAINT "UQ_d430a02aad006d8a70f3acd7d03" UNIQUE ("roleId", "permissionId"), CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attendances_status_enum" AS ENUM('present', 'absent', 'late')`);
        await queryRunner.query(`CREATE TABLE "attendances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."attendances_status_enum" NOT NULL, "sessionId" uuid, "studentId" uuid, CONSTRAINT "UQ_7c4623087030d1ba925ad1eef44" UNIQUE ("sessionId", "studentId"), CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lectures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "code" character varying(32), "description" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sessionId" uuid, "createdBy" uuid, "updatedBy" uuid, CONSTRAINT "PK_0fbf04287eb4e401af19caf7677" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_lectures_session_code" ON "lectures" ("sessionId", "code") `);
        await queryRunner.query(`CREATE TABLE "lecture_materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sortOrder" integer NOT NULL DEFAULT '0', "lectureId" uuid, "materialId" uuid, CONSTRAINT "UQ_6d5b1bc40ef769b99bc626c98ae" UNIQUE ("lectureId", "materialId"), CONSTRAINT "PK_076c6d7bb14dd0938e0f867c46f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "grade" double precision, "feedback" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assignmentId" uuid, "studentId" uuid, "materialId" uuid NOT NULL, CONSTRAINT "UQ_d08e86921fcb85d36ba6aa41bf2" UNIQUE ("assignmentId", "studentId"), CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."material_upload_sessions_status_enum" AS ENUM('initiated', 'uploading', 'completed', 'aborted', 'failed')`);
        await queryRunner.query(`CREATE TABLE "material_upload_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uploadId" character varying(255) NOT NULL, "bucket" character varying(255) NOT NULL, "objectKey" text NOT NULL, "fileName" character varying(255) NOT NULL, "mimeType" character varying(255), "size" bigint NOT NULL, "partSize" integer NOT NULL, "totalParts" integer NOT NULL, "status" "public"."material_upload_sessions_status_enum" NOT NULL DEFAULT 'initiated', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "materialId" uuid, "workspaceId" uuid, "assignmentId" uuid, "uploadedBy" uuid, CONSTRAINT "PK_430d70eb8c59994adb00bc2a7ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."materials_status_enum" AS ENUM('pending', 'ready', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."materials_category_enum" AS ENUM('general', 'lecture', 'assignment', 'submission')`);
        await queryRunner.query(`CREATE TABLE "materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "status" "public"."materials_status_enum" NOT NULL DEFAULT 'ready', "bucket" character varying(255) NOT NULL, "objectKey" text NOT NULL, "fileName" character varying(255) NOT NULL, "mimeType" character varying(255), "size" integer, "category" "public"."materials_category_enum" NOT NULL DEFAULT 'general', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspaceId" uuid, "uploadedBy" uuid, CONSTRAINT "PK_2fd1a93ecb222a28bef28663fa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sortOrder" integer NOT NULL DEFAULT '0', "assignmentId" uuid, "materialId" uuid, CONSTRAINT "UQ_d3bd5fbdee672b8de5f7ad2bbf7" UNIQUE ("assignmentId", "materialId"), CONSTRAINT "PK_915e280e0db9f45c6983295d26a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_quiz_questions_type_enum" AS ENUM('single_choice')`);
        await queryRunner.query(`CREATE TABLE "assignment_quiz_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "type" "public"."assignment_quiz_questions_type_enum" NOT NULL DEFAULT 'single_choice', "points" double precision NOT NULL DEFAULT '1', "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assignmentId" uuid, "materialId" uuid, CONSTRAINT "PK_6455a0c1a83e20029005701ba08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_quiz_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "questionId" uuid, CONSTRAINT "PK_c276bd2bd6e459e639eb2b829cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_quiz_attempt_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isCorrect" boolean NOT NULL, "awardedPoints" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attemptId" uuid, "questionId" uuid, "selectedOptionId" uuid, CONSTRAINT "UQ_4e1956e9c84762d36f495eaab46" UNIQUE ("attemptId", "questionId"), CONSTRAINT "PK_5aa6517434d5b71c3c8cb5f8fc0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_quiz_attempts_status_enum" AS ENUM('in_progress', 'submitted')`);
        await queryRunner.query(`CREATE TABLE "assignment_quiz_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."assignment_quiz_attempts_status_enum" NOT NULL DEFAULT 'in_progress', "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "submittedAt" TIMESTAMP WITH TIME ZONE, "score" double precision, "maxScore" double precision NOT NULL DEFAULT '0', "correctCount" integer NOT NULL DEFAULT '0', "totalQuestions" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assignmentId" uuid, "studentId" uuid, CONSTRAINT "UQ_059febc82c76ff5b7fcb660a267" UNIQUE ("assignmentId", "studentId"), CONSTRAINT "PK_8ed394030f97d8d81aa106c438c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignments_type_enum" AS ENUM('manual', 'quiz')`);
        await queryRunner.query(`CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."assignments_type_enum" NOT NULL DEFAULT 'manual', "title" character varying(255) NOT NULL, "code" character varying(32), "description" text, "timeStart" TIMESTAMP WITH TIME ZONE NOT NULL, "timeEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sessionId" uuid, "createdBy" uuid, "updatedBy" uuid, CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_assignments_session_code" ON "assignments" ("sessionId", "code") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timeStart" TIMESTAMP WITH TIME ZONE NOT NULL, "timeEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "topic" character varying(255) NOT NULL, "code" character varying(32), "classId" uuid, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_sessions_class_code" ON "sessions" ("classId", "code") `);
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "className" character varying NOT NULL, "description" text, "workspaceId" uuid, CONSTRAINT "UQ_b1fb7b694f3b8668dc11a7bbc47" UNIQUE ("className", "workspaceId"), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "class_students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "classId" uuid, "studentId" uuid, "roleId" uuid, CONSTRAINT "UQ_800605a0412a8d21a45a7ca32fc" UNIQUE ("classId", "studentId"), CONSTRAINT "PK_f1ef7a4fd2eabf7ef3c6bc7cae3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "workspaceId" uuid, "classId" uuid, "isSystem" boolean NOT NULL DEFAULT true, CONSTRAINT "CHK_roles_scope" CHECK ((
    ("isSystem" = true AND "workspaceId" IS NULL AND "classId" IS NULL)
    OR
    ("isSystem" = false AND "workspaceId" IS NOT NULL AND "classId" IS NULL)
    OR
    ("isSystem" = false AND "workspaceId" IS NULL AND "classId" IS NOT NULL)
  )), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_roles_class_name" ON "roles" ("classId", "name") WHERE "isSystem" = false AND "classId" IS NOT NULL AND "workspaceId" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_roles_workspace_name" ON "roles" ("workspaceId", "name") WHERE "isSystem" = false AND "workspaceId" IS NOT NULL AND "classId" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_roles_system_name" ON "roles" ("name") WHERE "isSystem" = true AND "workspaceId" IS NULL AND "classId" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_status_enum" AS ENUM('active', 'invited', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "workspace_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."workspace_members_status_enum" NOT NULL DEFAULT 'active', "workspaceId" uuid, "userId" uuid, "roleId" uuid, CONSTRAINT "UQ_99bcb5fdac446371d41f048b24f" UNIQUE ("workspaceId", "userId"), CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."plan_features_valuetype_enum" AS ENUM('boolean', 'number', 'string', 'json')`);
        await queryRunner.query(`CREATE TABLE "plan_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "featureKey" character varying(100) NOT NULL, "valueType" "public"."plan_features_valuetype_enum" NOT NULL, "booleanValue" boolean, "numberValue" bigint, "stringValue" character varying(255), "jsonValue" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "planId" uuid, CONSTRAINT "CHK_plan_features_value_by_type" CHECK ((
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
  )), CONSTRAINT "PK_eb2b32d1d93a8b2e96e122e3a77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_plan_features_feature_key" ON "plan_features" ("featureKey") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_plan_features_plan_feature_key" ON "plan_features" ("planId", "featureKey") `);
        await queryRunner.query(`CREATE TYPE "public"."plan_prices_interval_enum" AS ENUM('monthly')`);
        await queryRunner.query(`CREATE TABLE "plan_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "currency" character varying(3) NOT NULL, "interval" "public"."plan_prices_interval_enum" NOT NULL, "stripePriceId" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "planId" uuid, CONSTRAINT "CHK_plan_prices_amount_non_negative" CHECK ("amount" >= 0), CONSTRAINT "PK_69b05dce9891d42a3d0fc77eec1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_plan_prices_stripe_price_id" ON "plan_prices" ("stripePriceId") WHERE "stripePriceId" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_plan_prices_active_plan_currency_interval" ON "plan_prices" ("planId", "currency", "interval") WHERE "isActive" = true`);
        await queryRunner.query(`CREATE INDEX "idx_plan_prices_plan_active" ON "plan_prices" ("planId", "isActive") `);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "isPublic" boolean NOT NULL DEFAULT true, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_plans_code" ON "plans" ("code") `);
        await queryRunner.query(`CREATE TYPE "public"."billing_subscriptions_status_enum" AS ENUM('pending_activation', 'active', 'past_due', 'cancelled', 'expired')`);
        await queryRunner.query(`CREATE TYPE "public"."billing_subscriptions_provider_enum" AS ENUM('stripe')`);
        await queryRunner.query(`CREATE TYPE "public"."billing_subscriptions_billingcycle_enum" AS ENUM('monthly')`);
        await queryRunner.query(`CREATE TABLE "billing_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."billing_subscriptions_status_enum" NOT NULL, "provider" "public"."billing_subscriptions_provider_enum" NOT NULL DEFAULT 'stripe', "providerSubscriptionRef" character varying(255), "billingCycle" "public"."billing_subscriptions_billingcycle_enum" NOT NULL DEFAULT 'monthly', "activatedAt" TIMESTAMP WITH TIME ZONE, "currentPeriodStart" TIMESTAMP WITH TIME ZONE, "currentPeriodEnd" TIMESTAMP WITH TIME ZONE, "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "cancelledAt" TIMESTAMP WITH TIME ZONE, "endedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspaceId" uuid, "planId" uuid, "nextPlanId" uuid, CONSTRAINT "PK_da12bd094f95ed1a9ad21b0b2df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_billing_subscriptions_current_workspace" ON "billing_subscriptions" ("workspaceId") WHERE "endedAt" IS NULL`);
        await queryRunner.query(`CREATE INDEX "idx_billing_subscriptions_plan_status" ON "billing_subscriptions" ("planId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_billing_subscriptions_workspace_status" ON "billing_subscriptions" ("workspaceId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_type_enum" AS ENUM('initial_charge', 'recurring_charge')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_status_enum" AS ENUM('pending', 'paid', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_provider_enum" AS ENUM('stripe')`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."payment_transactions_type_enum" NOT NULL, "status" "public"."payment_transactions_status_enum" NOT NULL, "amountCents" integer NOT NULL, "billingPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL, "billingPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "provider" "public"."payment_transactions_provider_enum" NOT NULL, "providerTransactionRef" character varying(255), "paidAt" TIMESTAMP WITH TIME ZONE, "failedAt" TIMESTAMP WITH TIME ZONE, "failureReason" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "billingSubscriptionId" uuid, "workspaceId" uuid, "planId" uuid, CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_payment_transactions_subscription_period_type" ON "payment_transactions" ("billingSubscriptionId", "billingPeriodStart", "billingPeriodEnd", "type") `);
        await queryRunner.query(`CREATE INDEX "idx_payment_transactions_workspace_created_at" ON "payment_transactions" ("workspaceId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_payment_transactions_subscription_status" ON "payment_transactions" ("billingSubscriptionId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."workspace_subscriptions_status_enum" AS ENUM('trialing', 'active', 'suspended', 'cancelled', 'expired')`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_subscriptions_source_enum" AS ENUM('workspace_creation', 'billing_payment', 'billing_fallback', 'admin_override')`);
        await queryRunner.query(`CREATE TABLE "workspace_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."workspace_subscriptions_status_enum" NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endedAt" TIMESTAMP WITH TIME ZONE, "trialEndsAt" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "source" "public"."workspace_subscriptions_source_enum" NOT NULL, "paymentTransactionId" uuid, "note" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspaceId" uuid, "planId" uuid, CONSTRAINT "PK_98db3712679ce8ee3435961d85a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_workspace_subscriptions_active_workspace" ON "workspace_subscriptions" ("workspaceId") WHERE "status" IN ('active', 'trialing')`);
        await queryRunner.query(`CREATE INDEX "idx_workspace_subscriptions_plan_status" ON "workspace_subscriptions" ("planId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_workspace_subscriptions_workspace_status" ON "workspace_subscriptions" ("workspaceId", "status") `);
        await queryRunner.query(`CREATE TABLE "workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "ownerId" uuid, CONSTRAINT "UQ_77607c5b6af821ec294d33aab0c" UNIQUE ("ownerId"), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(64) NOT NULL, "title" character varying(255) NOT NULL, "body" text NOT NULL, "data" jsonb, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP WITH TIME ZONE, "dedupeKey" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "recipientUserId" uuid, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_notifications_dedupe_key" ON "notifications" ("dedupeKey") WHERE "dedupeKey" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_recipient_is_read" ON "notifications" ("recipientUserId", "isRead") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_recipient_created_at" ON "notifications" ("recipientUserId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_d5140a0a7ab7511a8d326eef004" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_615b414059091a9a8ea0355ae89" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_aff98a6230cc6b4822c24f61781" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_b994040553b45177bdddf48cf4a" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_bb975c1ee7166653f698c4facf0" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lecture_materials" ADD CONSTRAINT "FK_d3bdb6072e394f406a6c1a44863" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lecture_materials" ADD CONSTRAINT "FK_805b6e7a3ec5a881d5804ab2347" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_c2611c601f49945ceff5c0909a2" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_4fc99318a291abd7e2a50f50851" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_77309b1a2b32d135cc964da9e54" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" ADD CONSTRAINT "FK_208fa9a1ca791d584e0430eb843" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" ADD CONSTRAINT "FK_ca305dd36a50aadd34872769c81" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" ADD CONSTRAINT "FK_fe99e7184c70f50504d127a10b8" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" ADD CONSTRAINT "FK_499dce643fa3c1e6f2e13d0c7ed" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materials" ADD CONSTRAINT "FK_633abc7189f3df279c285bae965" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materials" ADD CONSTRAINT "FK_3b6d3a01d78c3813ec2493dafa1" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_materials" ADD CONSTRAINT "FK_61761388b83b686f81111ca9e19" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_materials" ADD CONSTRAINT "FK_1ddfb307c9c817e3c9c3f31e374" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_questions" ADD CONSTRAINT "FK_479350680a00c26be74433b257b" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_questions" ADD CONSTRAINT "FK_879047531444d05233fb67fafa5" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_options" ADD CONSTRAINT "FK_4fc3936f4ca7e4115102c547890" FOREIGN KEY ("questionId") REFERENCES "assignment_quiz_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempt_answers" ADD CONSTRAINT "FK_a5bfbe76375c725c758035b6011" FOREIGN KEY ("attemptId") REFERENCES "assignment_quiz_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempt_answers" ADD CONSTRAINT "FK_d1de5c5e927a032a420629f12d6" FOREIGN KEY ("questionId") REFERENCES "assignment_quiz_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempt_answers" ADD CONSTRAINT "FK_07c88cb7663fc53206992b6ac83" FOREIGN KEY ("selectedOptionId") REFERENCES "assignment_quiz_options"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempts" ADD CONSTRAINT "FK_46f5f954d607e401b69ce0f3d5e" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempts" ADD CONSTRAINT "FK_9c21463fb5827d02f1e19f3f356" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_11bdbd10e3a85d51c380340344c" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_ebb0bafe3eff0186ec00094e169" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_e6b37c6a7737728dcd06e2abeac" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_df8bda143f8079aed2bbe55342a" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_39860a7df747ee5b715665e30a1" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_8077e3550bf215749c0cdd138c2" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_4e9a9986dd87d6448440f840144" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_9119b757d44aac201483c04e075" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_2ca8fd190172e61f282f79afe85" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_features" ADD CONSTRAINT "FK_33f1dcdcdf132c3a113e8c4505d" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_prices" ADD CONSTRAINT "FK_eb2f222f91a8e78e9e1d591b0de" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "FK_9ae49c53d5e0b5a33d6ac3e1097" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "FK_9e5e291ae7c0d27467434528e91" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "FK_2adce177cba6b085715ed9c7d24" FOREIGN KEY ("nextPlanId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_3a2757f65c5c07b0372a2a1e020" FOREIGN KEY ("billingSubscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_46ba8d0813c582afcd9e75d6205" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_66ad7ef110991224c43791a6ae7" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "FK_bf174cdc32ae4c928feacc61c74" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "FK_7589d5be22e9a7012b2d12c9331" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "FK_fb028a17443a1c1807a284ef740" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD CONSTRAINT "FK_77607c5b6af821ec294d33aab0c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_0be815cabd15a62a5546a4b1357" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_0be815cabd15a62a5546a4b1357"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP CONSTRAINT "FK_77607c5b6af821ec294d33aab0c"`);
        await queryRunner.query(`ALTER TABLE "workspace_subscriptions" DROP CONSTRAINT "FK_fb028a17443a1c1807a284ef740"`);
        await queryRunner.query(`ALTER TABLE "workspace_subscriptions" DROP CONSTRAINT "FK_7589d5be22e9a7012b2d12c9331"`);
        await queryRunner.query(`ALTER TABLE "workspace_subscriptions" DROP CONSTRAINT "FK_bf174cdc32ae4c928feacc61c74"`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_66ad7ef110991224c43791a6ae7"`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_46ba8d0813c582afcd9e75d6205"`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_3a2757f65c5c07b0372a2a1e020"`);
        await queryRunner.query(`ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "FK_2adce177cba6b085715ed9c7d24"`);
        await queryRunner.query(`ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "FK_9e5e291ae7c0d27467434528e91"`);
        await queryRunner.query(`ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "FK_9ae49c53d5e0b5a33d6ac3e1097"`);
        await queryRunner.query(`ALTER TABLE "plan_prices" DROP CONSTRAINT "FK_eb2f222f91a8e78e9e1d591b0de"`);
        await queryRunner.query(`ALTER TABLE "plan_features" DROP CONSTRAINT "FK_33f1dcdcdf132c3a113e8c4505d"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_2ca8fd190172e61f282f79afe85"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_9119b757d44aac201483c04e075"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_4e9a9986dd87d6448440f840144"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_8077e3550bf215749c0cdd138c2"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_39860a7df747ee5b715665e30a1"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_df8bda143f8079aed2bbe55342a"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_e6b37c6a7737728dcd06e2abeac"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_ebb0bafe3eff0186ec00094e169"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_11bdbd10e3a85d51c380340344c"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempts" DROP CONSTRAINT "FK_9c21463fb5827d02f1e19f3f356"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempts" DROP CONSTRAINT "FK_46f5f954d607e401b69ce0f3d5e"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempt_answers" DROP CONSTRAINT "FK_07c88cb7663fc53206992b6ac83"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempt_answers" DROP CONSTRAINT "FK_d1de5c5e927a032a420629f12d6"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_attempt_answers" DROP CONSTRAINT "FK_a5bfbe76375c725c758035b6011"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_options" DROP CONSTRAINT "FK_4fc3936f4ca7e4115102c547890"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_questions" DROP CONSTRAINT "FK_879047531444d05233fb67fafa5"`);
        await queryRunner.query(`ALTER TABLE "assignment_quiz_questions" DROP CONSTRAINT "FK_479350680a00c26be74433b257b"`);
        await queryRunner.query(`ALTER TABLE "assignment_materials" DROP CONSTRAINT "FK_1ddfb307c9c817e3c9c3f31e374"`);
        await queryRunner.query(`ALTER TABLE "assignment_materials" DROP CONSTRAINT "FK_61761388b83b686f81111ca9e19"`);
        await queryRunner.query(`ALTER TABLE "materials" DROP CONSTRAINT "FK_3b6d3a01d78c3813ec2493dafa1"`);
        await queryRunner.query(`ALTER TABLE "materials" DROP CONSTRAINT "FK_633abc7189f3df279c285bae965"`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" DROP CONSTRAINT "FK_499dce643fa3c1e6f2e13d0c7ed"`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" DROP CONSTRAINT "FK_fe99e7184c70f50504d127a10b8"`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" DROP CONSTRAINT "FK_ca305dd36a50aadd34872769c81"`);
        await queryRunner.query(`ALTER TABLE "material_upload_sessions" DROP CONSTRAINT "FK_208fa9a1ca791d584e0430eb843"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_77309b1a2b32d135cc964da9e54"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_4fc99318a291abd7e2a50f50851"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_c2611c601f49945ceff5c0909a2"`);
        await queryRunner.query(`ALTER TABLE "lecture_materials" DROP CONSTRAINT "FK_805b6e7a3ec5a881d5804ab2347"`);
        await queryRunner.query(`ALTER TABLE "lecture_materials" DROP CONSTRAINT "FK_d3bdb6072e394f406a6c1a44863"`);
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_bb975c1ee7166653f698c4facf0"`);
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_b994040553b45177bdddf48cf4a"`);
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_aff98a6230cc6b4822c24f61781"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_615b414059091a9a8ea0355ae89"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_d5140a0a7ab7511a8d326eef004"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_recipient_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_recipient_is_read"`);
        await queryRunner.query(`DROP INDEX "public"."uq_notifications_dedupe_key"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "workspaces"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workspace_subscriptions_workspace_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workspace_subscriptions_plan_status"`);
        await queryRunner.query(`DROP INDEX "public"."uq_workspace_subscriptions_active_workspace"`);
        await queryRunner.query(`DROP TABLE "workspace_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_subscriptions_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payment_transactions_subscription_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payment_transactions_workspace_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."uq_payment_transactions_subscription_period_type"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_billing_subscriptions_workspace_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_billing_subscriptions_plan_status"`);
        await queryRunner.query(`DROP INDEX "public"."uq_billing_subscriptions_current_workspace"`);
        await queryRunner.query(`DROP TABLE "billing_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."billing_subscriptions_billingcycle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."billing_subscriptions_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."billing_subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."uq_plans_code"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plan_prices_plan_active"`);
        await queryRunner.query(`DROP INDEX "public"."uq_plan_prices_active_plan_currency_interval"`);
        await queryRunner.query(`DROP INDEX "public"."uq_plan_prices_stripe_price_id"`);
        await queryRunner.query(`DROP TABLE "plan_prices"`);
        await queryRunner.query(`DROP TYPE "public"."plan_prices_interval_enum"`);
        await queryRunner.query(`DROP INDEX "public"."uq_plan_features_plan_feature_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plan_features_feature_key"`);
        await queryRunner.query(`DROP TABLE "plan_features"`);
        await queryRunner.query(`DROP TYPE "public"."plan_features_valuetype_enum"`);
        await queryRunner.query(`DROP TABLE "workspace_members"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_roles_system_name"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_roles_workspace_name"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_roles_class_name"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "class_students"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP INDEX "public"."uq_sessions_class_code"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."uq_assignments_session_code"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP TYPE "public"."assignments_type_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_quiz_attempts"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_quiz_attempts_status_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_quiz_attempt_answers"`);
        await queryRunner.query(`DROP TABLE "assignment_quiz_options"`);
        await queryRunner.query(`DROP TABLE "assignment_quiz_questions"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_quiz_questions_type_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_materials"`);
        await queryRunner.query(`DROP TABLE "materials"`);
        await queryRunner.query(`DROP TYPE "public"."materials_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."materials_status_enum"`);
        await queryRunner.query(`DROP TABLE "material_upload_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."material_upload_sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "submissions"`);
        await queryRunner.query(`DROP TABLE "lecture_materials"`);
        await queryRunner.query(`DROP INDEX "public"."uq_lectures_session_code"`);
        await queryRunner.query(`DROP TABLE "lectures"`);
        await queryRunner.query(`DROP TABLE "attendances"`);
        await queryRunner.query(`DROP TYPE "public"."attendances_status_enum"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_accounttype_enum"`);
    }

}
