import { ApiProperty } from "@nestjs/swagger";

export class UserEntity {
  @ApiProperty({ type: Number, description: '主键' })
  id: number;

  @ApiProperty({ type: String, description: '用户地址' })
  address: string;

  @ApiProperty({ type: Number, description: '用户ID' })
  user_id: number;

  @ApiProperty({ type: String, description: 'ETH 余额，单位wei' })
  eth_balance: string;
}
