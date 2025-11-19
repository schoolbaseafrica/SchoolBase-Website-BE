import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Session } from '../src/modules/sessions/entities/session.entity';

describe('SessionsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let sessionRepo: Repository<Session>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override the Session repository with a mock
      .overrideProvider(getRepositoryToken(Session))
      .useValue({
        find: jest.fn().mockResolvedValue([
          {
            id: '1',
            userId: '123',
            isActive: true,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          },
        ]),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = app.get(JwtService);
    sessionRepo = app.get(getRepositoryToken(Session));

    // Generate a valid JWT for testing
    accessToken = jwtService.sign({ sub: '123', username: 'testuser' });
  });

  it('/auth/sessions (GET) - should return all active sessions for the user', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('userId', '123');
  });

  it('/auth/sessions (GET) - should return 401 if no token is provided', async () => {
    await request(app.getHttpServer())
      .get('/auth/sessions')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
