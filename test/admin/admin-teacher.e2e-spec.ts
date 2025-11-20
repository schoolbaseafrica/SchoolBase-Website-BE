import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Admin → Create Teacher (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /admin/teachers', () => {
    it('should successfully create a teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/teachers')
        .set('Authorization', 'Bearer admin_dummy_token') // Adjust if real auth is implemented
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        status_code: 201,
        message: 'Teacher account successfully created',
        data: {
          email: 'jane.doe@example.com',
          status: 'pending_activation',
        },
      });

      expect(response.body.data.teacher_id).toBeDefined();
    });

    it('should fail when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/admin/teachers')
        .set('Authorization', 'Bearer admin_dummy_token')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'duplicate@example.com',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/admin/teachers')
        .set('Authorization', 'Bearer admin_dummy_token')
        .send({
          firstName: 'John',
          lastName: 'Smith',
          email: 'duplicate@example.com',
        })
        .expect(400);

      expect(response.body.message).toContain('Email already exists');
    });

    it('should fail validation when fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/teachers')
        .set('Authorization', 'Bearer admin_dummy_token')
        .send({
          firstName: '',
          email: 'invalid@example.com',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });
});