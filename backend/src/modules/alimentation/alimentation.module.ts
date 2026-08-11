import { Module } from '@nestjs/common';
import { AlimentationService } from './alimentation.service';
import { StockController } from './stock.controller';
import { DistributionController } from './distribution.controller';

@Module({
  controllers: [StockController, DistributionController],
  providers: [AlimentationService],
})
export class AlimentationModule {}
