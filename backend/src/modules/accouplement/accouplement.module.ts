import { Module } from '@nestjs/common';
import { AccouplementService } from './accouplement.service';
import { AccouplementController } from './accouplement.controller';

@Module({
  controllers: [AccouplementController],
  providers: [AccouplementService],
  exports: [AccouplementService],
})
export class AccouplementModule {}
