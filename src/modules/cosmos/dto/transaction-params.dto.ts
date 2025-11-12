import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionParamsDto {
  @ApiProperty({ description: 'Transaction hash' })
  @IsString()
  @Matches(/^(0x)?[A-F0-9]{64}$/i, {
    message: 'Hash must be a valid 64-character hex string',
  })
  hash: string;
}
