import { Module } from '@nestjs/common';
import { CosmosController } from './cosmos.controller';
import { CosmosService } from './cosmos.service';

@Module({
  controllers: [CosmosController],
  providers: [CosmosService],
})
export class CosmosModule {}
