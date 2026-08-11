import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { FindPredictionsQueryDto } from './dto/find-predictions-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('predictions')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePredictionDto) {
    return this.predictionService.create(user.id, dto);
  }

  @Post('cheptel')
  creerPourCheptel(@CurrentUser() user: AuthUser) {
    return this.predictionService.creerPourCheptel(user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindPredictionsQueryDto,
  ) {
    return this.predictionService.findAll(user.id, query);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.predictionService.dashboard(user.id);
  }
}
