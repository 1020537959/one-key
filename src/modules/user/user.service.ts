import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { name } = createUserDto;
    return this.prisma.user.create({ data: { name } });
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
