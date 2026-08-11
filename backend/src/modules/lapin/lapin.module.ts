import { Module } from '@nestjs/common';
import { LapinService } from './lapin.service';
import { LapinController } from './lapin.controller';
import { RaceModule } from '../race/race.module';
import { CageModule } from '../cage/cage.module';

@Module({
  imports: [RaceModule, CageModule],
  controllers: [LapinController],
  providers: [LapinService],
  exports: [LapinService],
})
export class LapinModule {}
