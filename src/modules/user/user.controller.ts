import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchEthBalanceDto, SearchEthBalanceResultDto } from './dto/search-eth-balance.dto';
import { ApiOkResponseData } from '../dto/response.dto';
import { UserEntity } from './entities/user.entity';
import { AuthUser } from '../dto/auth-user.dto';

@ApiTags('用户')
@Controller('v1')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '创建' })
  @Post('users')
  @ApiOkResponseData({ type: UserEntity })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @ApiOperation({ summary: '详情' })
  @Get('users/:id')
  @ApiOkResponseData({ type: UserEntity })
  async findOneById(@Param('id') id: number) {
    return this.userService.findOneById(id);
  }

  @ApiOperation({ summary: '根据用户地址查询余额' })
  @Get('user/eth')
  @ApiOkResponseData({ type: SearchEthBalanceResultDto })
  async searchEthBalance(@Query() dto: SearchEthBalanceDto) {
    // TODO 模拟cookie对应的用户信息
    const user: AuthUser = { id: 1, name: '蓝浩楠' };
    return this.userService.searchEthBalance(dto, user);
  }
}
