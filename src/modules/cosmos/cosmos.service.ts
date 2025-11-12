import {
  Injectable,
  Logger,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Env } from '../../config/env-validation';
import { CosmosBlockResponseDto } from './dto/block-response.dto';
import { CosmosTransactionResponseDto } from './dto/transaction-response.dto';

interface CosmosBlockResponse {
  block_id: {
    hash: string;
  };
  block: {
    header: {
      height: string;
      time: string;
      proposer_address: string;
    };
  };
}

interface CosmosTransactionResponse {
  hash: string;
  height: string;
  index: number;
  tx_result: {
    log?: string;
    events?: Array<{
      type: string;
      attributes?: Array<{
        key: string;
        value: string | null;
      }>;
    }>;
    gas_used?: string;
    gas_wanted?: string;
  };
  tx: string;
}

interface CosmosRpcError {
  code?: number;
  message?: string;
  data?: unknown;
}

interface LogEvent {
  type: string;
  attributes?: Array<{
    key: string;
    value?: string;
  }>;
}

interface LogData {
  events?: LogEvent[];
}

@Injectable()
export class CosmosService {
  private readonly logger = new Logger(CosmosService.name);
  private readonly rpcClient: AxiosInstance;

  constructor(private configService: ConfigService<Env, true>) {
    const rpcUrl: string = this.configService.get('COSMOS_RPC');
    const normalizedUrl = rpcUrl.endsWith('/') ? rpcUrl.slice(0, -1) : rpcUrl;
    this.logger.log(
      `Initializing Cosmos RPC client with URL: ${normalizedUrl}`,
    );
    this.rpcClient = axios.create({
      baseURL: normalizedUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  private async callRpc<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.rpcClient.get<T | CosmosRpcError>(endpoint);
      const data = response.data as T & CosmosRpcError;

      // Проверка структуры ошибки RPC
      if (
        data &&
        typeof data === 'object' &&
        'code' in data &&
        data.code !== undefined &&
        data.code !== 0
      ) {
        const errorMsg =
          (typeof data.data === 'string' ? data.data : undefined) ||
          data.message ||
          'Unknown RPC error';
        const isNotFound =
          data.code === -32603 ||
          String(errorMsg).toLowerCase().includes('not found');

        throw isNotFound
          ? new NotFoundException(errorMsg)
          : new BadGatewayException(`RPC Error: ${errorMsg}`);
      }

      return data as T;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      this.logger.error(`RPC call failed: ${endpoint}`, error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundException('Resource not found');
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new BadGatewayException('Cannot connect to RPC node');
        }
        const errorData = error.response?.data as
          | { error?: string; message?: string }
          | undefined;
        const errorMsg =
          errorData?.error ||
          errorData?.message ||
          error.message ||
          'Unknown error';
        throw new BadGatewayException(`RPC Error: ${errorMsg}`);
      }

      throw new BadGatewayException(
        `Failed to communicate with RPC node: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getBlockByHeight(height: number): Promise<CosmosBlockResponseDto> {
    const response = await this.callRpc<CosmosBlockResponse>(
      `/block?height=${height}`,
    );

    if (!response?.block?.header || !response.block_id?.hash) {
      this.logger.error(
        `Invalid block structure for height ${height}`,
        response,
      );
      throw new BadGatewayException('Invalid response from RPC node');
    }

    const { header } = response.block;

    return {
      height: parseInt(header.height, 10),
      time: header.time,
      hash: response.block_id.hash.toUpperCase(),
      proposerAddress: (header.proposer_address || '').toUpperCase(),
    };
  }

  async getTransactionByHash(
    hash: string,
  ): Promise<CosmosTransactionResponseDto> {
    const cleanHash = hash.replace(/^0x/i, '').toUpperCase();
    let response: CosmosTransactionResponse;

    try {
      response = await this.callRpc<CosmosTransactionResponse>(
        `/tx?hash=${cleanHash}`,
      );
    } catch (error) {
      // Пробуем с lowercase, если не найдено
      if (error instanceof NotFoundException) {
        try {
          response = await this.callRpc<CosmosTransactionResponse>(
            `/tx?hash=${cleanHash.toLowerCase()}`,
          );
        } catch {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (!response?.tx_result) {
      this.logger.error(
        `Invalid transaction response for hash ${hash}`,
        response,
      );
      throw new BadGatewayException(
        'Invalid transaction response from RPC node',
      );
    }

    const timestamp = await this.getTransactionTimestamp(response.height);

    return {
      hash: response.hash,
      height: parseInt(response.height, 10),
      time: timestamp,
      gasUsed: response.tx_result.gas_used || '0',
      gasWanted: response.tx_result.gas_wanted || '0',
      fee: this.extractFee(response.tx_result.events),
      sender: this.extractSender(response.tx_result),
    };
  }

  private async getTransactionTimestamp(height: string): Promise<string> {
    try {
      const block = await this.getBlockByHeight(parseInt(height, 10));
      return block.time;
    } catch (error) {
      this.logger.warn(
        `Failed to get block timestamp for height ${height}`,
        error,
      );
      return new Date().toISOString();
    }
  }

  private extractSender(
    txResult: CosmosTransactionResponse['tx_result'],
  ): string {
    // Извлечение sender из log
    if (txResult.log) {
      try {
        const logData = JSON.parse(txResult.log) as LogData[];
        const events = logData?.[0]?.events || [];
        const senderAttr = events
          .find((e) => e.type === 'message')
          ?.attributes?.find((a) => a.key === 'sender');
        if (senderAttr?.value) {
          return senderAttr.value;
        }
      } catch (error) {
        this.logger.warn(`Failed to parse transaction log: ${error}`);
      }
    }

    // Извлечение sender из events (ключи в base64)
    if (txResult.events) {
      for (const event of txResult.events) {
        if (event.type === 'message') {
          const senderAttr = event.attributes?.find((attr) => {
            try {
              return (
                Buffer.from(attr.key, 'base64').toString('utf-8') === 'sender'
              );
            } catch {
              return false;
            }
          });
          if (senderAttr?.value) {
            try {
              return Buffer.from(senderAttr.value, 'base64').toString('utf-8');
            } catch {
              return senderAttr.value;
            }
          }
        }
      }
    }

    return '';
  }

  private extractFee(
    events?: CosmosTransactionResponse['tx_result']['events'],
  ): string {
    if (!events) return '0';

    for (const event of events) {
      if (event.type === 'tx') {
        const feeAttr = event.attributes?.find((attr) => {
          try {
            return Buffer.from(attr.key, 'base64').toString('utf-8') === 'fee';
          } catch {
            return false;
          }
        });

        if (feeAttr) {
          if (!feeAttr.value) return '0';
          try {
            return (
              Buffer.from(feeAttr.value, 'base64').toString('utf-8') || '0'
            );
          } catch {
            return feeAttr.value || '0';
          }
        }
      }
    }

    return '0';
  }
}
