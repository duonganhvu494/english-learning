import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthSecurityService } from 'src/auth/auth-security.service';

const TAG_DESCRIPTIONS = [
  {
    name: 'Auth',
    description:
      'Cookie-based authentication, session refresh, current-user bootstrap, and password change flows.',
  },
  {
    name: 'Workspaces',
    description:
      'Workspace creation, workspace detail, and student lifecycle management inside each workspace.',
  },
  {
    name: 'Classes',
    description:
      'Class creation, roster management, and student membership operations inside a workspace.',
  },
  {
    name: 'Sessions',
    description:
      'Scheduled teaching sessions that belong to classes and act as the parent scope for lectures and assignments.',
  },
  {
    name: 'Lectures',
    description:
      'Lecture content management, including lecture materials delivered to class members.',
  },
  {
    name: 'Assignments',
    description:
      'Manual and quiz assignment workflows, including quiz authoring, attempt lifecycle, and assignment materials.',
  },
  {
    name: 'Submissions',
    description:
      'Student submission upload flow and teacher review flow for manual assignments.',
  },
  {
    name: 'Attendances',
    description:
      'Attendance roster, teacher updates, and student self check-in for sessions.',
  },
  {
    name: 'Materials',
    description:
      'Workspace-owned file assets uploaded through S3 multipart flows and reused by lectures, assignments, and submissions.',
  },
  {
    name: 'Users',
    description:
      'Teacher registration, profile update, and super-admin user management endpoints.',
  },
  {
    name: 'Workspace Roles',
    description:
      'Custom RBAC role and permission management at workspace scope.',
  },
  {
    name: 'Class Roles',
    description:
      'Custom RBAC role and permission management at class scope.',
  },
  {
    name: 'System',
    description:
      'Minimal system and health-check endpoints.',
  },
] as const;

export const setupSwagger = (app: INestApplication): void => {
  const config = app.get(ConfigService);
  const authSecurityService = app.get(AuthSecurityService);
  const swaggerEnabled = config.get<boolean>('app.swagger.enabled', false);

  if (!swaggerEnabled) {
    return;
  }

  const swaggerPath = config.get<string>('app.swagger.path', 'api-docs');

  let documentBuilder = new DocumentBuilder()
    .setTitle('English Classroom Management SaaS API')
    .setDescription(
      [
        'Backend API documentation for an English classroom management SaaS platform built with NestJS, PostgreSQL, Redis, and S3-backed file workflows.',
        '',
        '### Core Modules',
        '- Auth and session management',
        '- Workspaces, classes, and sessions',
        '- Lectures, assignments, quizzes, and submissions',
        '- Attendance and RBAC role management',
        '',
        '### Authentication Model',
        '- Protected routes use **cookie-based authentication**.',
        `- Write requests must include the **${authSecurityService.csrfHeaderName}** header.`,
        '- Use POST /auth/login to receive auth cookies, then GET /auth/csrf-token before testing write operations in Swagger or Postman.',
        '',
        '### What To Review First',
        '- Auth for login/session flows',
        '- Workspaces and Classes for the SaaS tenant structure',
        '- Assignments and Submissions for the core learning workflow',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
      },
      'cookieAuth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: authSecurityService.csrfHeaderName,
        description: 'CSRF header for cookie-authenticated write requests',
      },
      'csrfHeader',
    );

  for (const tag of TAG_DESCRIPTIONS) {
    documentBuilder = documentBuilder.addTag(tag.name, tag.description);
  }

  const documentConfig = documentBuilder.build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  const tagOrder = new Map<string, number>(
    TAG_DESCRIPTIONS.map((tag, index) => [tag.name, index]),
  );

  if (document.tags) {
    document.tags = [...document.tags].sort((left, right) => {
      const leftOrder = tagOrder.get(left.name) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = tagOrder.get(right.name) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
  }

  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'English Classroom Management API Docs',
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      filter: true,
    },
  });
};
