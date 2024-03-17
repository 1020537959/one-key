import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('用户')
@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '创建' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: '详情' })
  @Get(':id')
  async findOneById(@Param('id') id: number) {
    return this.userService.findOneById(id);
  }
}
