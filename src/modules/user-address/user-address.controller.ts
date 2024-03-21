import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ApiOkResponseData } from '../dto/response.dto';
import {
  SearchEthBalanceDto,
  SearchEthBalanceResultDto,
} from './dto/search-eth-balance.dto';
import { UserAddressEntity } from './entities/user-address.entity';
import { UserAddressService } from './user-address.service';

@ApiTags('用户')
@Controller()
export class userUserController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @ApiOperation({ summary: '详情' })
  @Get('v1/user-address')
  @ApiQuery({ name: 'address', type: String, description: '用户地址' })
  @ApiOkResponseData({ type: UserAddressEntity })
  async findOneByQuery(@Query('address') address: string) {
    return this.userAddressService.findOneByQuery(address);
  }

  @ApiOperation({ summary: '根据用户地址查询余额 - V1' })
  @Get('v1/user-address/eth')
  @ApiOkResponseData({ type: SearchEthBalanceResultDto })
  async searchEthBalanceV1(@Query() dto: SearchEthBalanceDto) {
    return this.userAddressService.searchEthBalanceV1(dto);
  }
}
