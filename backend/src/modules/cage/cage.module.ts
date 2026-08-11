import { Module } from '@nestjs/common';
import { CageService } from './cage.service';
import { CageController } from './cage.controller';

@Module({
  controllers: [CageController],
  providers: [CageService],
  exports: [CageService],
})
export class CageModule {}
