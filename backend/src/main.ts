// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { RequestMethod } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  });

  // ✅ Globalni prefix za sve HTTP rute
  app.setGlobalPrefix('api', {
    // Ostavlja Swagger na /docs i /docs-json BEZ prefiksa
    exclude: [
      { path: 'docs', method: RequestMethod.GET },
      { path: 'docs-json', method: RequestMethod.GET },
      // (Opcionalno) ako koristiš statičke fajlove za Swagger UI:
      { path: 'docs/(.*)', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerCfg = new DocumentBuilder()
    .setTitle('Casino Platform API')
    .setDescription('API dokumentacija za player i operator deo')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    // ✅ Kaži Swaggeru da je server pod /api, da "Try it out" radi
    .addServer('/api')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerCfg);

  SwaggerModule.setup('docs', app, swaggerDoc, {
    swaggerOptions: { persistAuthorization: true },
    // ✅ Alternativno (umesto addServer), može i ovo:
    // useGlobalPrefix: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
