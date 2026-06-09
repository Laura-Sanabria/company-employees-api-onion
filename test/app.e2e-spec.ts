import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const jwtService = app.get<JwtService>(JwtService);
    token = jwtService.sign({ sub: 1, correo: 'admin@ejemplo.com', rol: 'ADMIN' });
  });

  it('/api/companias (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/companias')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
