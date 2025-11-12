import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionParamsDto {
  @ApiProperty({ description: 'Transaction hash' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'Hash must be a valid 64-character hex string starting with 0x',
  })
  hash: string;
}
