import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CosmosService } from './cosmos.service';
import { CosmosBlockResponseDto } from './dto/block-response.dto';
import { TransactionParamsDto } from './dto/transaction-params.dto';
import { CosmosTransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('Cosmos')
@Controller('cosmos')
export class CosmosController {
  constructor(private readonly cosmosService: CosmosService) {}

  @Get('block/:height')
  @ApiOperation({ summary: 'Get Cosmos block by height' })
  @ApiResponse({
    status: 200,
    description: 'Block information',
    type: CosmosBlockResponseDto,
  })
  async getBlockByHeight(
    @Param('height', ParseIntPipe) height: number,
  ): Promise<CosmosBlockResponseDto> {
    return this.cosmosService.getBlockByHeight(height);
  }

  @Get('transactions/:hash')
  @ApiOperation({ summary: 'Get Cosmos transaction by hash' })
  @ApiResponse({
    status: 200,
    description: 'Transaction information',
    type: CosmosTransactionResponseDto,
  })
  async getTransactionByHash(
    @Param() params: TransactionParamsDto,
  ): Promise<CosmosTransactionResponseDto> {
    return this.cosmosService.getTransactionByHash(params.hash);
  }
}
