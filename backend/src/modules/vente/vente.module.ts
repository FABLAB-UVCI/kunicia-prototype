import { Module } from '@nestjs/common';
import { VenteService } from './vente.service';
import { VenteController } from './vente.controller';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [ClientModule],
  controllers: [VenteController],
  providers: [VenteService],
})
export class VenteModule {}
