import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EthBalanceEventDto {
  @ApiProperty({ type: String, description: '交易发送方账户地址' })
  @IsNotEmpty()
  from: string;

  @ApiProperty({ type: String, description: '消息的目标地址' })
  @IsNotEmpty()
  to: string;

  @ApiProperty({ type: String, description: '交易值' })
  @IsNotEmpty()
  eth: string;
}

export class HandleEthBalanceEventDto {
  @ApiProperty({ type: String, description: '交易 Hash' })
  @IsNotEmpty()
  transactionHash: string;
}
