import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class EthBalanceEventDto {
  @ApiProperty({ type: String, description: '用户地址' })
  @IsNotEmpty()
  address: string;

  @ApiProperty({ type: Number, description: '用户ID' })
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ type: String, description: 'ETH 余额' })
  @IsNotEmpty()
  eth_balance: string;
}

export class HandleEthBalanceEventDto {
  @ApiProperty({ type: String, description: '用户地址' })
  @IsNotEmpty()
  address: string;

  @ApiProperty({ type: Number, description: '用户ID' })
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ type: String, description: 'ETH 余额' })
  @IsNotEmpty()
  eth_balance: string;

  @ApiProperty({ type: Number, description: '13位时间戳' })
  @IsNotEmpty()
  timestamp: number;

  @ApiProperty({ type: String, description: '版本' })
  @IsNotEmpty()
  version: string;
}