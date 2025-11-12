import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { defaultEnv } from './commons/modules/environment/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ['.env'],
      validate: (env: Record<string, unknown>) => defaultEnv.parse(env),
    }),
    LoggerModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
