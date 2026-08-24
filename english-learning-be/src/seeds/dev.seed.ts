import "reflect-metadata";

import * as bcrypt from "bcryptjs";

import dataSource from "../config/typeorm-data-source";

const DEV_PASSWORD = "Test123456";

const IDS = {
  users: {
    teacher: "10000000-0000-4000-8000-000000000001",
    student1: "10000000-0000-4000-8000-000000000002",
    student2: "10000000-0000-4000-8000-000000000003",
    student3: "10000000-0000-4000-8000-000000000004",
    student4: "10000000-0000-4000-8000-000000000005",
    student5: "10000000-0000-4000-8000-000000000006",
  },

  workspace: "20000000-0000-4000-8000-000000000001",

  classes: {
    toeic: "30000000-0000-4000-8000-000000000001",
    ielts: "30000000-0000-4000-8000-000000000002",
  },

  classRoles: {
    toeicStudent: "31000000-0000-4000-8000-000000000001",
    ieltsStudent: "31000000-0000-4000-8000-000000000002",
  },

  sessions: {
    toeicReading: "40000000-0000-4000-8000-000000000001",
    toeicListening: "40000000-0000-4000-8000-000000000002",
    ieltsSpeaking: "40000000-0000-4000-8000-000000000003",
  },

  lectures: {
    reading: "41000000-0000-4000-8000-000000000001",
    listening: "41000000-0000-4000-8000-000000000002",
  },

  materials: {
    general: "50000000-0000-4000-8000-000000000001",
    lecture: "50000000-0000-4000-8000-000000000002",
    assignment: "50000000-0000-4000-8000-000000000003",
    submission1: "50000000-0000-4000-8000-000000000004",
    submission2: "50000000-0000-4000-8000-000000000005",
  },

  uploadSessions: {
    assignment: "51000000-0000-4000-8000-000000000001",
    submission1: "51000000-0000-4000-8000-000000000002",
    submission2: "51000000-0000-4000-8000-000000000003",
  },

  assignments: {
    manual: "60000000-0000-4000-8000-000000000001",
    quiz: "60000000-0000-4000-8000-000000000002",
  },

  questions: {
    q1: "61000000-0000-4000-8000-000000000001",
    q2: "61000000-0000-4000-8000-000000000002",
    q3: "61000000-0000-4000-8000-000000000003",
  },

  options: {
    q1a: "62000000-0000-4000-8000-000000000001",
    q1b: "62000000-0000-4000-8000-000000000002",
    q1c: "62000000-0000-4000-8000-000000000003",
    q1d: "62000000-0000-4000-8000-000000000004",

    q2a: "62000000-0000-4000-8000-000000000005",
    q2b: "62000000-0000-4000-8000-000000000006",
    q2c: "62000000-0000-4000-8000-000000000007",
    q2d: "62000000-0000-4000-8000-000000000008",

    q3a: "62000000-0000-4000-8000-000000000009",
    q3b: "62000000-0000-4000-8000-000000000010",
    q3c: "62000000-0000-4000-8000-000000000011",
    q3d: "62000000-0000-4000-8000-000000000012",
  },

  attempts: {
    student1: "63000000-0000-4000-8000-000000000001",
    student2: "63000000-0000-4000-8000-000000000002",
  },

  billingSubscription: "70000000-0000-4000-8000-000000000001",

  paymentTransaction: "71000000-0000-4000-8000-000000000001",

  workspaceSubscription: "72000000-0000-4000-8000-000000000001",
};

type IdRow = {
  id: string;
};

type PlanRow = {
  id: string;
  code: string;
};

type PermissionRow = {
  id: string;
  action: string;
  resource: string;
};

async function seed(): Promise<void> {
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const existingUsers = (await queryRunner.query(
      `
        SELECT "id"
        FROM "users"
        WHERE "email" = $1
        LIMIT 1
      `,
      ["owner@test.com"],
    )) as IdRow[];

    if (existingUsers.length > 0) {
      await queryRunner.rollbackTransaction();

      console.log("");
      console.log("Dev seed already exists.");
      console.log("");
      console.log("Teacher:");
      console.log("  Username: demo.teacher");
      console.log("  Email: owner@test.com");
      console.log(`  Password: ${DEV_PASSWORD}`);
      console.log("");

      return;
    }

    const ownerRoles = (await queryRunner.query(
      `
        SELECT "id"
        FROM "roles"
        WHERE "name" = 'owner'
          AND "isSystem" = true
          AND "workspaceId" IS NULL
          AND "classId" IS NULL
        LIMIT 1
      `,
    )) as IdRow[];

    const studentRoles = (await queryRunner.query(
      `
        SELECT "id"
        FROM "roles"
        WHERE "name" = 'student'
          AND "isSystem" = true
          AND "workspaceId" IS NULL
          AND "classId" IS NULL
        LIMIT 1
      `,
    )) as IdRow[];

    if (!ownerRoles[0] || !studentRoles[0]) {
      throw new Error(
        [
          "System RBAC roles are missing.",
          "Run migration first and start the backend once",
          "so RbacSeedService can create system roles and permissions.",
        ].join(" "),
      );
    }

    const ownerRoleId = ownerRoles[0].id;
    const systemStudentRoleId = studentRoles[0].id;

    const permissionRows = (await queryRunner.query(
      `
        SELECT "id", "action", "resource"
        FROM "permissions"
      `,
    )) as PermissionRow[];

    const permissionIds = new Map<string, string>(
      permissionRows.map((permission) => [
        `${permission.action}:${permission.resource}`,
        permission.id,
      ]),
    );

    const requiredClassPermissions = [
      "read:session",
      "read:lecture",
      "read:assignment",
    ];

    for (const permissionKey of requiredClassPermissions) {
      if (!permissionIds.has(permissionKey)) {
        throw new Error(
          `Required RBAC permission is missing: ${permissionKey}`,
        );
      }
    }

    const planRows = (await queryRunner.query(
      `
        SELECT "id", "code"
        FROM "plans"
        WHERE "code" IN (
          'free',
          'intermediate',
          'advanced'
        )
      `,
    )) as PlanRow[];

    const planIds = new Map<string, string>(
      planRows.map((plan) => [plan.code, plan.id]),
    );

    const advancedPlanId = planIds.get("advanced");

    if (!advancedPlanId) {
      throw new Error(
        [
          "Advanced plan is missing.",
          "Run migration first and start the backend once",
          "so PlansSeedService can create the plan catalog.",
        ].join(" "),
      );
    }

    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

    await queryRunner.query(
      `
        INSERT INTO "users" (
          "id",
          "fullName",
          "userName",
          "email",
          "password",
          "mustChangePassword",
          "emailVerificationRequired",
          "emailVerifiedAt",
          "accountType",
          "isSuperAdmin",
          "isActive"
        )
        VALUES
          (
            $1,
            'Demo Teacher',
            'demo.teacher',
            'owner@test.com',
            $7,
            false,
            false,
            now(),
            'teacher',
            false,
            true
          ),
          (
            $2,
            'Nguyễn Văn An',
            'student01',
            'student1@test.com',
            $7,
            false,
            false,
            now(),
            'student',
            false,
            true
          ),
          (
            $3,
            'Trần Minh Bình',
            'student02',
            'student2@test.com',
            $7,
            false,
            false,
            now(),
            'student',
            false,
            true
          ),
          (
            $4,
            'Lê Hoàng Chi',
            'student03',
            'student3@test.com',
            $7,
            false,
            false,
            now(),
            'student',
            false,
            true
          ),
          (
            $5,
            'Phạm Gia Duy',
            'student04',
            'student4@test.com',
            $7,
            false,
            false,
            now(),
            'student',
            false,
            true
          ),
          (
            $6,
            'Võ Ngọc Hà',
            'student05',
            'student5@test.com',
            $7,
            false,
            false,
            now(),
            'student',
            false,
            true
          )
      `,
      [
        IDS.users.teacher,
        IDS.users.student1,
        IDS.users.student2,
        IDS.users.student3,
        IDS.users.student4,
        IDS.users.student5,
        passwordHash,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "workspaces" (
          "id",
          "name",
          "isActive",
          "ownerId"
        )
        VALUES (
          $1,
          'English Learning Demo Center',
          true,
          $2
        )
      `,
      [IDS.workspace, IDS.users.teacher],
    );

    await queryRunner.query(
      `
        INSERT INTO "workspace_members" (
          "status",
          "workspaceId",
          "userId",
          "roleId"
        )
        VALUES
          (
            'active',
            $1,
            $2,
            $8
          ),
          (
            'active',
            $1,
            $3,
            $9
          ),
          (
            'active',
            $1,
            $4,
            $9
          ),
          (
            'active',
            $1,
            $5,
            $9
          ),
          (
            'active',
            $1,
            $6,
            $9
          ),
          (
            'active',
            $1,
            $7,
            $9
          )
      `,
      [
        IDS.workspace,
        IDS.users.teacher,
        IDS.users.student1,
        IDS.users.student2,
        IDS.users.student3,
        IDS.users.student4,
        IDS.users.student5,
        ownerRoleId,
        systemStudentRoleId,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "classes" (
          "id",
          "className",
          "description",
          "workspaceId"
        )
        VALUES
          (
            $1,
            'TOEIC Foundation 01',
            'Lớp TOEIC nền tảng dành cho học viên mới bắt đầu.',
            $3
          ),
          (
            $2,
            'IELTS Foundation 01',
            'Lớp IELTS nền tảng tập trung bốn kỹ năng.',
            $3
          )
      `,
      [IDS.classes.toeic, IDS.classes.ielts, IDS.workspace],
    );

    await queryRunner.query(
      `
        INSERT INTO "roles" (
          "id",
          "name",
          "description",
          "workspaceId",
          "classId",
          "isSystem"
        )
        VALUES
          (
            $1,
            'student',
            'Default class student role',
            NULL,
            $3,
            false
          ),
          (
            $2,
            'student',
            'Default class student role',
            NULL,
            $4,
            false
          )
      `,
      [
        IDS.classRoles.toeicStudent,
        IDS.classRoles.ieltsStudent,
        IDS.classes.toeic,
        IDS.classes.ielts,
      ],
    );

    for (const classRoleId of [
      IDS.classRoles.toeicStudent,
      IDS.classRoles.ieltsStudent,
    ]) {
      for (const permissionKey of requiredClassPermissions) {
        const permissionId = permissionIds.get(permissionKey);

        if (!permissionId) {
          throw new Error(`Permission not found: ${permissionKey}`);
        }

        await queryRunner.query(
          `
            INSERT INTO "role_permissions" (
              "roleId",
              "permissionId"
            )
            VALUES ($1, $2)
            ON CONFLICT (
              "roleId",
              "permissionId"
            )
            DO NOTHING
          `,
          [classRoleId, permissionId],
        );
      }
    }

    await queryRunner.query(
      `
        INSERT INTO "class_students" (
          "classId",
          "studentId",
          "roleId"
        )
        VALUES
          (
            $1,
            $3,
            $2
          ),
          (
            $1,
            $4,
            $2
          ),
          (
            $1,
            $5,
            $2
          ),
          (
            $1,
            $6,
            $2
          ),

          (
            $7,
            $3,
            $8
          ),
          (
            $7,
            $4,
            $8
          ),
          (
            $7,
            $9,
            $8
          )
      `,
      [
        IDS.classes.toeic,
        IDS.classRoles.toeicStudent,

        IDS.users.student1,
        IDS.users.student2,
        IDS.users.student3,
        IDS.users.student4,

        IDS.classes.ielts,
        IDS.classRoles.ieltsStudent,

        IDS.users.student5,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "sessions" (
          "id",
          "timeStart",
          "timeEnd",
          "topic",
          "code",
          "classId"
        )
        VALUES
          (
            $1,
            now() - interval '7 days',
            now() - interval '7 days' + interval '2 hours',
            'TOEIC Reading - Part 5',
            'SES001',
            $4
          ),
          (
            $2,
            now() + interval '3 days',
            now() + interval '3 days' + interval '2 hours',
            'TOEIC Listening - Part 2',
            'SES002',
            $4
          ),
          (
            $3,
            now() + interval '2 days',
            now() + interval '2 days' + interval '2 hours',
            'IELTS Speaking - Introduction',
            'SES001',
            $5
          )
      `,
      [
        IDS.sessions.toeicReading,
        IDS.sessions.toeicListening,
        IDS.sessions.ieltsSpeaking,
        IDS.classes.toeic,
        IDS.classes.ielts,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "attendances" (
          "status",
          "sessionId",
          "studentId"
        )
        VALUES
          (
            'present',
            $1,
            $2
          ),
          (
            'present',
            $1,
            $3
          ),
          (
            'late',
            $1,
            $4
          ),
          (
            'absent',
            $1,
            $5
          )
      `,
      [
        IDS.sessions.toeicReading,
        IDS.users.student1,
        IDS.users.student2,
        IDS.users.student3,
        IDS.users.student4,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "materials" (
          "id",
          "title",
          "status",
          "bucket",
          "objectKey",
          "fileName",
          "mimeType",
          "size",
          "category",
          "workspaceId",
          "uploadedBy"
        )
        VALUES
          (
            $1,
            'TOEIC Vocabulary List',
            'ready',
            'dev-bucket',
            'demo/general/toeic-vocabulary.pdf',
            'toeic-vocabulary.pdf',
            'application/pdf',
            180000,
            'general',
            $6,
            $7
          ),
          (
            $2,
            'TOEIC Reading Slides',
            'ready',
            'dev-bucket',
            'demo/lecture/toeic-reading.pdf',
            'toeic-reading-slides.pdf',
            'application/pdf',
            520000,
            'lecture',
            $6,
            $7
          ),
          (
            $3,
            'Reading Homework',
            'ready',
            'dev-bucket',
            'demo/assignment/reading-homework.pdf',
            'reading-homework.pdf',
            'application/pdf',
            320000,
            'assignment',
            $6,
            $7
          ),
          (
            $4,
            'Student 1 Submission',
            'ready',
            'dev-bucket',
            'demo/submission/student1.pdf',
            'student1-homework.pdf',
            'application/pdf',
            210000,
            'submission',
            $6,
            $8
          ),
          (
            $5,
            'Student 2 Submission',
            'ready',
            'dev-bucket',
            'demo/submission/student2.pdf',
            'student2-homework.pdf',
            'application/pdf',
            195000,
            'submission',
            $6,
            $9
          )
      `,
      [
        IDS.materials.general,
        IDS.materials.lecture,
        IDS.materials.assignment,
        IDS.materials.submission1,
        IDS.materials.submission2,

        IDS.workspace,

        IDS.users.teacher,
        IDS.users.student1,
        IDS.users.student2,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "lectures" (
          "id",
          "title",
          "code",
          "description",
          "sessionId",
          "createdBy",
          "updatedBy"
        )
        VALUES
          (
            $1,
            'TOEIC Reading Part 5',
            'LEC001',
            'Cách nhận diện từ loại và chọn đáp án trong TOEIC Reading Part 5.',
            $3,
            $5,
            $5
          ),
          (
            $2,
            'TOEIC Listening Part 2',
            'LEC001',
            'Các dạng câu hỏi thường gặp trong TOEIC Listening Part 2.',
            $4,
            $5,
            $5
          )
      `,
      [
        IDS.lectures.reading,
        IDS.lectures.listening,

        IDS.sessions.toeicReading,
        IDS.sessions.toeicListening,

        IDS.users.teacher,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "lecture_materials" (
          "sortOrder",
          "lectureId",
          "materialId"
        )
        VALUES
          (
            0,
            $1,
            $2
          ),
          (
            1,
            $1,
            $3
          )
      `,
      [IDS.lectures.reading, IDS.materials.lecture, IDS.materials.general],
    );

    await queryRunner.query(
      `
        INSERT INTO "assignments" (
          "id",
          "type",
          "title",
          "code",
          "description",
          "timeStart",
          "timeEnd",
          "sessionId",
          "createdBy",
          "updatedBy"
        )
        VALUES
          (
            $1,
            'manual',
            'TOEIC Reading Homework',
            'ASM001',
            'Hoàn thành bài tập Part 5 và nộp tệp PDF.',
            now() - interval '5 days',
            now() + interval '5 days',
            $3,
            $5,
            $5
          ),
          (
            $2,
            'quiz',
            'TOEIC Vocabulary Quiz',
            'ASM001',
            'Bài kiểm tra nhanh từ vựng TOEIC.',
            now() - interval '1 day',
            now() + interval '7 days',
            $4,
            $5,
            $5
          )
      `,
      [
        IDS.assignments.manual,
        IDS.assignments.quiz,

        IDS.sessions.toeicReading,
        IDS.sessions.toeicListening,

        IDS.users.teacher,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "assignment_materials" (
          "sortOrder",
          "assignmentId",
          "materialId"
        )
        VALUES
          (
            0,
            $1,
            $2
          ),
          (
            1,
            $1,
            $3
          )
      `,
      [IDS.assignments.manual, IDS.materials.assignment, IDS.materials.general],
    );

    await queryRunner.query(
      `
        INSERT INTO "material_upload_sessions" (
          "id",
          "uploadId",
          "bucket",
          "objectKey",
          "fileName",
          "mimeType",
          "size",
          "partSize",
          "totalParts",
          "status",
          "expiresAt",
          "completedAt",
          "materialId",
          "workspaceId",
          "assignmentId",
          "uploadedBy"
        )
        VALUES
          (
            $1,
            'dev-upload-assignment',
            'dev-bucket',
            'demo/assignment/reading-homework.pdf',
            'reading-homework.pdf',
            'application/pdf',
            320000,
            5242880,
            1,
            'completed',
            now() + interval '1 day',
            now(),
            $4,
            $7,
            $8,
            $9
          ),
          (
            $2,
            'dev-upload-submission-1',
            'dev-bucket',
            'demo/submission/student1.pdf',
            'student1-homework.pdf',
            'application/pdf',
            210000,
            5242880,
            1,
            'completed',
            now() + interval '1 day',
            now(),
            $5,
            $7,
            $8,
            $10
          ),
          (
            $3,
            'dev-upload-submission-2',
            'dev-bucket',
            'demo/submission/student2.pdf',
            'student2-homework.pdf',
            'application/pdf',
            195000,
            5242880,
            1,
            'completed',
            now() + interval '1 day',
            now(),
            $6,
            $7,
            $8,
            $11
          )
      `,
      [
        IDS.uploadSessions.assignment,
        IDS.uploadSessions.submission1,
        IDS.uploadSessions.submission2,

        IDS.materials.assignment,
        IDS.materials.submission1,
        IDS.materials.submission2,

        IDS.workspace,
        IDS.assignments.manual,

        IDS.users.teacher,
        IDS.users.student1,
        IDS.users.student2,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "submissions" (
          "submittedAt",
          "grade",
          "feedback",
          "assignmentId",
          "studentId",
          "materialId"
        )
        VALUES
          (
            now() - interval '6 hours',
            8.5,
            'Bài làm tốt, cần chú ý thêm phần từ loại.',
            $1,
            $2,
            $4
          ),
          (
            now() - interval '3 hours',
            7.0,
            'Hoàn thành đầy đủ nhưng còn một số lỗi ngữ pháp.',
            $1,
            $3,
            $5
          )
      `,
      [
        IDS.assignments.manual,

        IDS.users.student1,
        IDS.users.student2,

        IDS.materials.submission1,
        IDS.materials.submission2,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "assignment_quiz_questions" (
          "id",
          "content",
          "type",
          "points",
          "sortOrder",
          "assignmentId"
        )
        VALUES
          (
            $1,
            'Choose the synonym of "purchase".',
            'single_choice',
            10,
            0,
            $4
          ),
          (
            $2,
            'Choose the correct word: The manager ___ the report yesterday.',
            'single_choice',
            10,
            1,
            $4
          ),
          (
            $3,
            'Which word means "khách hàng"?',
            'single_choice',
            10,
            2,
            $4
          )
      `,
      [
        IDS.questions.q1,
        IDS.questions.q2,
        IDS.questions.q3,

        IDS.assignments.quiz,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "assignment_quiz_options" (
          "id",
          "content",
          "isCorrect",
          "sortOrder",
          "questionId"
        )
        VALUES
          (
            $1,
            'buy',
            true,
            0,
            $13
          ),
          (
            $2,
            'sell',
            false,
            1,
            $13
          ),
          (
            $3,
            'borrow',
            false,
            2,
            $13
          ),
          (
            $4,
            'return',
            false,
            3,
            $13
          ),

          (
            $5,
            'reviewed',
            true,
            0,
            $14
          ),
          (
            $6,
            'reviews',
            false,
            1,
            $14
          ),
          (
            $7,
            'reviewing',
            false,
            2,
            $14
          ),
          (
            $8,
            'review',
            false,
            3,
            $14
          ),

          (
            $9,
            'customer',
            true,
            0,
            $15
          ),
          (
            $10,
            'employee',
            false,
            1,
            $15
          ),
          (
            $11,
            'supplier',
            false,
            2,
            $15
          ),
          (
            $12,
            'manager',
            false,
            3,
            $15
          )
      `,
      [
        IDS.options.q1a,
        IDS.options.q1b,
        IDS.options.q1c,
        IDS.options.q1d,

        IDS.options.q2a,
        IDS.options.q2b,
        IDS.options.q2c,
        IDS.options.q2d,

        IDS.options.q3a,
        IDS.options.q3b,
        IDS.options.q3c,
        IDS.options.q3d,

        IDS.questions.q1,
        IDS.questions.q2,
        IDS.questions.q3,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "assignment_quiz_attempts" (
          "id",
          "status",
          "startedAt",
          "submittedAt",
          "score",
          "maxScore",
          "correctCount",
          "totalQuestions",
          "assignmentId",
          "studentId"
        )
        VALUES
          (
            $1,
            'submitted',
            now() - interval '40 minutes',
            now() - interval '30 minutes',
            20,
            30,
            2,
            3,
            $3,
            $4
          ),
          (
            $2,
            'in_progress',
            now() - interval '10 minutes',
            NULL,
            NULL,
            30,
            0,
            3,
            $3,
            $5
          )
      `,
      [
        IDS.attempts.student1,
        IDS.attempts.student2,

        IDS.assignments.quiz,

        IDS.users.student1,
        IDS.users.student2,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "assignment_quiz_attempt_answers" (
          "isCorrect",
          "awardedPoints",
          "attemptId",
          "questionId",
          "selectedOptionId"
        )
        VALUES
          (
            true,
            10,
            $1,
            $2,
            $5
          ),
          (
            false,
            0,
            $1,
            $3,
            $6
          ),
          (
            true,
            10,
            $1,
            $4,
            $7
          )
      `,
      [
        IDS.attempts.student1,

        IDS.questions.q1,
        IDS.questions.q2,
        IDS.questions.q3,

        IDS.options.q1a,
        IDS.options.q2b,
        IDS.options.q3a,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "billing_subscriptions" (
          "id",
          "status",
          "provider",
          "providerSubscriptionRef",
          "billingCycle",
          "activatedAt",
          "currentPeriodStart",
          "currentPeriodEnd",
          "cancelAtPeriodEnd",
          "cancelledAt",
          "endedAt",
          "workspaceId",
          "planId",
          "nextPlanId"
        )
        VALUES (
          $1,
          'active',
          'stripe',
          'sub_dev_advanced',
          'monthly',
          now() - interval '5 days',
          now() - interval '5 days',
          now() + interval '25 days',
          false,
          NULL,
          NULL,
          $2,
          $3,
          NULL
        )
      `,
      [IDS.billingSubscription, IDS.workspace, advancedPlanId],
    );

    await queryRunner.query(
      `
        INSERT INTO "payment_transactions" (
          "id",
          "type",
          "status",
          "amountCents",
          "billingPeriodStart",
          "billingPeriodEnd",
          "provider",
          "providerTransactionRef",
          "paidAt",
          "failedAt",
          "failureReason",
          "billingSubscriptionId",
          "workspaceId",
          "planId"
        )
        VALUES (
          $1,
          'initial_charge',
          'paid',
          1900,
          now() - interval '5 days',
          now() + interval '25 days',
          'stripe',
          'pi_dev_advanced',
          now() - interval '5 days',
          NULL,
          NULL,
          $2,
          $3,
          $4
        )
      `,
      [
        IDS.paymentTransaction,
        IDS.billingSubscription,
        IDS.workspace,
        advancedPlanId,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "workspace_subscriptions" (
          "id",
          "status",
          "startedAt",
          "endedAt",
          "trialEndsAt",
          "cancelledAt",
          "source",
          "paymentTransactionId",
          "note",
          "workspaceId",
          "planId"
        )
        VALUES (
          $1,
          'active',
          now() - interval '5 days',
          NULL,
          NULL,
          NULL,
          'billing_payment',
          $2,
          'Demo Advanced subscription',
          $3,
          $4
        )
      `,
      [
        IDS.workspaceSubscription,
        IDS.paymentTransaction,
        IDS.workspace,
        advancedPlanId,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "notifications" (
          "type",
          "title",
          "body",
          "data",
          "isRead",
          "readAt",
          "dedupeKey",
          "recipientUserId"
        )
        VALUES
          (
            'assignment_created',
            'Bài tập mới',
            'Bạn có bài tập TOEIC Reading Homework mới.',
            $1::jsonb,
            false,
            NULL,
            'dev-assignment-student1',
            $3
          ),
          (
            'quiz_created',
            'Bài kiểm tra mới',
            'TOEIC Vocabulary Quiz đã được mở.',
            $2::jsonb,
            true,
            now(),
            'dev-quiz-student1',
            $3
          )
      `,
      [
        JSON.stringify({
          assignmentId: IDS.assignments.manual,
        }),

        JSON.stringify({
          assignmentId: IDS.assignments.quiz,
        }),

        IDS.users.student1,
      ],
    );

    await queryRunner.commitTransaction();

    console.log("");
    console.log("========================================");
    console.log("Dev seed completed successfully");
    console.log("========================================");
    console.log("");

    console.log("Teacher / Owner");
    console.log("----------------------------------------");
    console.log("Username : demo.teacher");
    console.log("Email    : owner@test.com");
    console.log(`Password : ${DEV_PASSWORD}`);
    console.log("");

    console.log("Students");
    console.log("----------------------------------------");
    console.log(`student01 | student1@test.com | ${DEV_PASSWORD}`);
    console.log(`student02 | student2@test.com | ${DEV_PASSWORD}`);
    console.log(`student03 | student3@test.com | ${DEV_PASSWORD}`);
    console.log(`student04 | student4@test.com | ${DEV_PASSWORD}`);
    console.log(`student05 | student5@test.com | ${DEV_PASSWORD}`);
    console.log("");

    console.log("Workspace");
    console.log("----------------------------------------");
    console.log("English Learning Demo Center");
    console.log("");

    console.log("Classes");
    console.log("----------------------------------------");
    console.log("TOEIC Foundation 01");
    console.log("IELTS Foundation 01");
    console.log("");

    console.log("Subscription");
    console.log("----------------------------------------");
    console.log("Advanced");
    console.log("");
  } catch (error) {
    await queryRunner.rollbackTransaction();

    throw error;
  } finally {
    await queryRunner.release();

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seed().catch((error) => {
  console.error("");
  console.error("Dev seed failed:");
  console.error(error);
  console.error("");

  process.exit(1);
});
