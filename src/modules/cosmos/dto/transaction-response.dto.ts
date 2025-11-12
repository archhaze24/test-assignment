import { ApiProperty } from '@nestjs/swagger';

export class CosmosTransactionResponseDto {
  @ApiProperty({ description: 'Transaction hash' })
  hash: string;

  @ApiProperty({ description: 'Block height' })
  height: number;

  @ApiProperty({ description: 'Transaction time' })
  time: string;

  @ApiProperty({ description: 'Gas used' })
  gasUsed: string;

  @ApiProperty({ description: 'Gas wanted' })
  gasWanted: string;

  @ApiProperty({ description: 'Transaction fee' })
  fee: string;

  @ApiProperty({ description: 'Sender address' })
  sender: string;
}
