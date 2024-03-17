import { ApiProperty } from "@nestjs/swagger";

export class AuthUser {
  @ApiProperty({ type: Number, description: '主键' })
  id: number;

  @ApiProperty({ type: String, description: '姓名' })
  name: string;
}