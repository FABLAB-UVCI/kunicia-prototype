import { Module } from '@nestjs/common';
import { DepenseService } from './depense.service';
import { DepenseController } from './depense.controller';

@Module({
  controllers: [DepenseController],
  providers: [DepenseService],
})
export class DepenseModule {}
