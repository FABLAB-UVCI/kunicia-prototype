import { Module } from '@nestjs/common';
import { SanteService } from './sante.service';
import { SanteController } from './sante.controller';

@Module({
  controllers: [SanteController],
  providers: [SanteService],
})
export class SanteModule {}
