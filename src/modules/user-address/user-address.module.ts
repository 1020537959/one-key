import { Module } from '@nestjs/common';
import { UserAddressService } from './user-address.service';
import { userUserController } from './user-address.controller';
import { BlockchainService } from './blockchain.service';

@Module({
  controllers: [userUserController],
  providers: [UserAddressService, BlockchainService],
})
export class userUserModule {}
