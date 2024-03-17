import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BasePageDto {
  @ApiProperty({
    type: Number,
    description: '是否分页0否1是,0时page=1,size=0',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  is_pager?: number;

  @ApiProperty({
    type: Number,
    description: '显示页数，为空时，默认1',
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    type: Number,
    description: '每页条数，为空时，默认10',
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiProperty({
    type: String,
    description: '排序字段,为空时，默认created_at',
    required: false,
  })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiProperty({
    type: String,
    description: '排序方式,为空时，默认DESC',
    required: false,
  })
  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC';
}
