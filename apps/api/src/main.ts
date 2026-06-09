import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { Env } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger estruturado (nestjs-pino) como logger oficial da app.
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Helix API')
    .setDescription('Chatbot com IA — clean architecture, Azure OpenAI, observabilidade')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`API ouvindo em http://localhost:${port} (docs em /docs)`);
}

void bootstrap();
