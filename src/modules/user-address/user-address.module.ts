import { Module } from '@nestjs/common';

import { BlockchainService } from './blockchain.service';
import { userUserController } from './user-address.controller';
import { UserAddressService } from './user-address.service';

@Module({
  controllers: [userUserController],
  providers: [UserAddressService, BlockchainService],
})
export class userUserModule {}
