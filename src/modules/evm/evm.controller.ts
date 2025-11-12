import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EvmService } from './evm.service';
import { EvmBlockResponseDto } from './dto/block-response.dto';
import { TransactionParamsDto } from './dto/transaction-params.dto';
import { EvmTransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('EVM')
@Controller('evm')
export class EvmController {
  constructor(private readonly evmService: EvmService) {}

  @Get('block/:height')
  @ApiOperation({ summary: 'Get EVM block by height' })
  @ApiResponse({
    status: 200,
    description: 'Block information',
    type: EvmBlockResponseDto,
  })
  async getBlockByHeight(
    @Param('height', ParseIntPipe) height: number,
  ): Promise<EvmBlockResponseDto> {
    return this.evmService.getBlockByHeight(height);
  }

  @Get('transactions/:hash')
  @ApiOperation({ summary: 'Get EVM transaction by hash' })
  @ApiResponse({
    status: 200,
    description: 'Transaction information',
    type: EvmTransactionResponseDto,
  })
  async getTransactionByHash(
    @Param() params: TransactionParamsDto,
  ): Promise<EvmTransactionResponseDto> {
    return this.evmService.getTransactionByHash(params.hash);
  }
}
