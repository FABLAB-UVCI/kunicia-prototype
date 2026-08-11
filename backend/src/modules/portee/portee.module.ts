import { Module } from '@nestjs/common';
import { PorteeService } from './portee.service';
import { PorteeController } from './portee.controller';
import { RaceModule } from '../race/race.module';

@Module({
  imports: [RaceModule],
  controllers: [PorteeController],
  providers: [PorteeService],
  exports: [PorteeService],
})
export class PorteeModule {}
