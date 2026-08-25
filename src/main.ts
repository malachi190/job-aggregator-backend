import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { EnvService } from './config/env.service';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: env.corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  await app.listen(env.port ?? 8080);
}
void bootstrap();
