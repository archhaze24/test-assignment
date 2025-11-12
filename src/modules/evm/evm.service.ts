import {
  Injectable,
  Logger,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Env } from '../../config/env-validation';
import { EvmBlockResponseDto } from './dto/block-response.dto';
import { EvmTransactionResponseDto } from './dto/transaction-response.dto';

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: unknown[];
  id: number;
}

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

interface BlockResult {
  number: string;
  hash: string;
  parentHash: string;
  gasLimit: string;
  gasUsed: string;
  size: string;
}

interface TransactionResult {
  hash: string;
  to: string | null;
  from: string;
  value: string;
  input: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
}

@Injectable()
export class EvmService {
  private readonly logger = new Logger(EvmService.name);
  private readonly rpcClient: AxiosInstance;

  constructor(private configService: ConfigService<Env, true>) {
    const rpcUrl: string = this.configService.get('EVM_RPC');
    const normalizedUrl = rpcUrl.endsWith('/') ? rpcUrl.slice(0, -1) : rpcUrl;
    this.logger.log(`Initializing EVM RPC client with URL: ${normalizedUrl}`);
    this.rpcClient = axios.create({
      baseURL: normalizedUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  private async callRpc<T>(method: string, params: unknown[]): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    };

    try {
      const response = await this.rpcClient.post<JsonRpcResponse<T>>(
        '',
        request,
      );

      if (response.data.error) {
        const { message, code } = response.data.error;
        const isNotFound = message.toLowerCase().includes('not found');

        throw isNotFound
          ? new NotFoundException(`Resource not found: ${message}`)
          : new BadGatewayException(`RPC Error: ${message} (code: ${code})`);
      }

      // RPC возвращает null при not found
      if (response.data.result === null || response.data.result === undefined) {
        throw new NotFoundException('Resource not found');
      }

      return response.data.result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      this.logger.error(`RPC call failed: ${method}`, error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new BadGatewayException('Cannot connect to RPC node');
        }
        const errorMsg = error.message || 'Unknown error';
        throw new BadGatewayException(`RPC request failed: ${errorMsg}`);
      }

      throw new BadGatewayException(
        `Failed to communicate with RPC node: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getBlockByHeight(height: number): Promise<EvmBlockResponseDto> {
    const blockNumber = `0x${height.toString(16)}`;
    const block = await this.callRpc<BlockResult>('eth_getBlockByNumber', [
      blockNumber,
      false,
    ]);

    return {
      height: parseInt(block.number, 16),
      hash: block.hash,
      parentHash: block.parentHash,
      gasLimit: block.gasLimit,
      gasUsed: block.gasUsed,
      size: parseInt(block.size, 16),
    };
  }

  async getTransactionByHash(hash: string): Promise<EvmTransactionResponseDto> {
    const tx = await this.callRpc<TransactionResult>(
      'eth_getTransactionByHash',
      [hash],
    );

    return {
      hash: tx.hash,
      to: tx.to,
      from: tx.from,
      value: tx.value,
      input: tx.input,
      maxFeePerGas: tx.maxFeePerGas || null,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || null,
      gasPrice: tx.gasPrice || null,
    };
  }
}
