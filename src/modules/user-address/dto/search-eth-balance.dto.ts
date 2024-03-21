import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SearchEthBalanceDto {
  @ApiProperty({ type: String, description: '用户地址（唯一）' })
  @IsNotEmpty()
  address: string;
}

export class SearchEthBalanceResultDto {
  @ApiProperty({ type: String, description: 'ETH 余额' })
  eth_balance: string;
}
