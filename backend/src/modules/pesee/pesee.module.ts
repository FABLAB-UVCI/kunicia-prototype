import { Module } from '@nestjs/common';
import { PeseeService } from './pesee.service';
import { PeseeController } from './pesee.controller';

@Module({
  controllers: [PeseeController],
  providers: [PeseeService],
  exports: [PeseeService],
})
export class PeseeModule {}
