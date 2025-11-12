import { ApiProperty } from '@nestjs/swagger';

export class CosmosBlockResponseDto {
  @ApiProperty({ description: 'Block height' })
  height: number;

  @ApiProperty({ description: 'Block time' })
  time: string;

  @ApiProperty({ description: 'Block hash' })
  hash: string;

  // В задании указано proposedAddress, но в Cosmos SDK используется proposerAddress,
  // то есть тот, кто предложил блок.
  // Скорее всего это опечатка, поэтому я использую proposerAddress.
  @ApiProperty({ description: 'Proposer address' })
  proposerAddress: string;
}
