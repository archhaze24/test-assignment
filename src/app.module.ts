import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { defaultEnv } from './config/env-validation';
import { EvmModule } from './modules/evm/evm.module';
import { CosmosModule } from './modules/cosmos/cosmos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ['.env'],
      validate: (env: Record<string, unknown>) => defaultEnv.parse(env),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
      }
    }),
    EvmModule,
    CosmosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
