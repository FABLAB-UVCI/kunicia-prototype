import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AlimentationService } from './alimentation.service';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { FindDistributionsQueryDto } from './dto/find-distributions-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('distributions')
export class DistributionController {
  constructor(private readonly alimentationService: AlimentationService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDistributionDto) {
    return this.alimentationService.createDistribution(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindDistributionsQueryDto,
  ) {
    return this.alimentationService.findAllDistributions(
      user.id,
      query.stockId,
    );
  }
}
