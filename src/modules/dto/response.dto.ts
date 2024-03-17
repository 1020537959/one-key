import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

export class ResponseDto {
  @ApiProperty({ type: 'number', example: 0 })
  readonly code: number;

  @ApiProperty({ type: 'string', example: '请求成功' })
  readonly msg: string;
}

export class Pagination {
  @ApiProperty({ type: 'number', description: '是否分页', example: 1 })
  is_pager: number;

  @ApiProperty({ type: 'number', description: '总条数', example: 100 })
  total: number;

  @ApiProperty({ type: 'number', description: '页码', example: 1 })
  page: number;

  @ApiProperty({ type: 'number', description: '每页数量', example: 10 })
  size: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  list: Array<T>;
  @ApiProperty()
  pagination: Pagination;
}

export const ApiResponse = <
  DataDto extends Type<unknown>,
  WrapperDataDto extends Type<unknown>,
>(
  dataDto: DataDto,
  wrapperDataDto: WrapperDataDto,
  isArray: boolean,
  description: string,
) => {
  let prop = null;

  if (isArray) {
    prop = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: { $ref: getSchemaPath(dataDto) },
        },
        pagination: {
          type: 'object',
          properties: {
            is_pager: {
              type: 'boolean',
              default: 0,
            },
            page: {
              type: 'number',
              default: 1,
            },
            size: {
              type: 'number',
              default: 10,
            },
            total: {
              type: 'number',
              default: 0,
            },
          },
        },
      },
    };
  } else {
    prop = { $ref: getSchemaPath(dataDto) };
  }

  return applyDecorators(
    ApiExtraModels(wrapperDataDto, dataDto),
    ApiOkResponse({
      description: description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(wrapperDataDto) },
          {
            type: 'object',
            properties: {
              data: prop,
            },
          },
        ],
      },
    }),
  );
};

/**
 * 封装 swagger 返回统一结构
 * 支持复杂类型 {  code, msg, data }
 * @param options.dataDto 返回的 data 的数据类型
 * @param options.isArray 是否是数组 则 data 类型为 { list<dataDto[]>, pagination } ,  false data 类型是 dataDto
 */

// 带code msg data
export const ApiOkResponseData = <DataDto extends Type<unknown>>(options: {
  type: DataDto;
  description?: string;
  isArray?: boolean;
}) =>
  ApiResponse(
    options.type,
    ResponseDto,
    options.isArray || false,
    options.description,
  );
