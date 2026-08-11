import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { LapinModule } from './modules/lapin/lapin.module';
import { CageModule } from './modules/cage/cage.module';
import { RaceModule } from './modules/race/race.module';
import { MouvementLapinModule } from './modules/mouvement-lapin/mouvement-lapin.module';
import { PorteeModule } from './modules/portee/portee.module';
import { AccouplementModule } from './modules/accouplement/accouplement.module';
import { PeseeModule } from './modules/pesee/pesee.module';
import { SanteModule } from './modules/sante/sante.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { AlimentationModule } from './modules/alimentation/alimentation.module';
import { ClientModule } from './modules/client/client.module';
import { VenteModule } from './modules/vente/vente.module';
import { DepenseModule } from './modules/depense/depense.module';
import { AuthModule } from './modules/auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LapinModule,
    CageModule,
    RaceModule,
    MouvementLapinModule,
    PorteeModule,
    AccouplementModule,
    PeseeModule,
    SanteModule,
    PredictionModule,
    AlimentationModule,
    ClientModule,
    VenteModule,
    DepenseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
