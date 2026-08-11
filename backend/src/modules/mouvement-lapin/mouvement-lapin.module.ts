import { Module } from '@nestjs/common';
import { MouvementLapinService } from './mouvement-lapin.service';
import { MouvementLapinController } from './mouvement-lapin.controller';

@Module({
  controllers: [MouvementLapinController],
  providers: [MouvementLapinService],
  exports: [MouvementLapinService],
})
export class MouvementLapinModule {}
