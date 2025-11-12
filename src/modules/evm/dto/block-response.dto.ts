import { ApiProperty } from '@nestjs/swagger';

export class EvmBlockResponseDto {
  @ApiProperty({ description: 'Block height' })
  height: number;

  @ApiProperty({ description: 'Block hash' })
  hash: string;

  @ApiProperty({ description: 'Parent block hash' })
  parentHash: string;

  @ApiProperty({ description: 'Gas limit' })
  gasLimit: string;

  @ApiProperty({ description: 'Gas used' })
  gasUsed: string;

  @ApiProperty({ description: 'Block size in bytes' })
  size: number;
}
