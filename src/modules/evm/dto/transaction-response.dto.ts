import { ApiProperty } from '@nestjs/swagger';

export class EvmTransactionResponseDto {
  @ApiProperty({ description: 'Transaction hash' })
  hash: string;

  @ApiProperty({ description: 'To address', nullable: true })
  to: string | null;

  @ApiProperty({ description: 'From address' })
  from: string;

  @ApiProperty({ description: 'Value in wei' })
  value: string;

  @ApiProperty({ description: 'Input data' })
  input: string;

  @ApiProperty({ description: 'Max fee per gas', nullable: true })
  maxFeePerGas: string | null;

  @ApiProperty({ description: 'Max priority fee per gas', nullable: true })
  maxPriorityFeePerGas: string | null;

  @ApiProperty({ description: 'Gas price', nullable: true })
  gasPrice: string | null;
}
